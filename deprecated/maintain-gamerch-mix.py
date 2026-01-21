#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import json
import os
import sys
import time
import re
import requests
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup
from http.client import IncompleteRead
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ====== 常量 ======
CHARACTER_MAP = {
    'オズ': {'id': 1, 'country_id': 1, 'en': 'oz'},
    'アーサー': {'id': 2, 'country_id': 1, 'en': 'arthur'},
    'カイン': {'id': 3, 'country_id': 1, 'en': 'cain'},
    'リケ': {'id': 4, 'country_id': 1, 'en': 'riquet'},
    'スノウ': {'id': 5, 'country_id': 2, 'en': 'snow'},
    'ホワイト': {'id': 6, 'country_id': 2, 'en': 'white'},
    'ミスラ': {'id': 7, 'country_id': 2, 'en': 'mithra'},
    'オーエン': {'id': 8, 'country_id': 2, 'en': 'owen'},
    'ブラッドリー': {'id': 9, 'country_id': 2, 'en': 'bradley'},
    'ファウスト': {'id': 10, 'country_id': 3, 'en': 'faust'},
    'シノ': {'id': 11, 'country_id': 3, 'en': 'shino'},
    'ヒースクリフ': {'id': 12, 'country_id': 3, 'en': 'heathcliff'},
    'ネロ': {'id': 13, 'country_id': 3, 'en': 'nero'},
    'シャイロック': {'id': 14, 'country_id': 4, 'en': 'shylock'},
    'ムル': {'id': 15, 'country_id': 4, 'en': 'murr'},
    'クロエ': {'id': 16, 'country_id': 4, 'en': 'chloe'},
    'ラスティカ': {'id': 17, 'country_id': 4, 'en': 'rustica'},
    'フィガロ': {'id': 18, 'country_id': 5, 'en': 'figaro'},
    'ルチル': {'id': 19, 'country_id': 5, 'en': 'rutile'},
    'レノックス': {'id': 20, 'country_id': 5, 'en': 'lennox'},
    'ミチル': {'id': 21, 'country_id': 5, 'en': 'mitile'}
}
RARITY_MAP = {'R': 2, 'SR': 3, 'SSR': 4}

# ====== 路径 ======
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "public" / "data"
LOG_DIR = Path(__file__).resolve().parent / "maintain-log"
LOG_DIR.mkdir(parents=True, exist_ok=True)

LAST_CARD_INFO_FILE = LOG_DIR / "last_card_info_id.txt"
LAST_MISMATCH_FILE = LOG_DIR / "last_characteristics_mismatch_id.txt"

ICON_DIR = DATA_DIR.parent / "images" / "card_icons"  # 即 public/images/card_icons/
ICON_DIR.mkdir(parents=True, exist_ok=True)

ICON_NAME_RE = re.compile(r'^Card_icon_(\d+)\.png$')

# ====== 日志工具 ======
def log(level, msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {level}: {msg}")

# ====== 图标补全：工具函数 ======

def get_existing_icon_ids(icons_dir: Path) -> set[int]:
    """
    扫描 public/images/card_icons/ 下已有的图标文件，按整数比较返回已存在的 id 集合。
    例如 Card_icon_14.png 和 Card_icon_1000.png 会正确识别为 14 与 1000（不会用字典序）。
    """
    ids = set()
    for p in icons_dir.glob("Card_icon_*.png"):
        m = ICON_NAME_RE.match(p.name)
        if not m:
            continue
        try:
            ids.add(int(m.group(1)))
        except ValueError:
            continue
    return ids


def get_card_ids_from_csv(card_csv: Path) -> set[int]:
    """
    读取 character_card.csv 的全部 id（整数化），用于与已有图标做差集补全“历史漏下的”。
    """
    ids = set()
    if not card_csv.exists():
        return ids
    with open(card_csv, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            v = row.get('id')
            if v is not None and str(v).strip().isdigit():
                ids.add(int(v))
    return ids


def download_icon_for_id(card_id: int, icons_dir: Path) -> bool:
    """
    通过 BWiki 的文件重定向接口下载图标：
    https://wiki.biligame.com/mahoyaku/Special:Redirect/file/Card_icon_<id>.png
    下载成功即覆盖（若文件已存在则直接返回 True）。
    """
    out_path = icons_dir / f"Card_icon_{card_id}.png"
    if out_path.exists():
        return True  # 已有文件，视为成功

    url = f"https://wiki.biligame.com/mahoyaku/Special:Redirect/file/Card_icon_{card_id}.png"
    try:
        resp = retry_request(url, headers={'User-Agent': 'Mozilla/5.0'})
    except Exception as e:
        log("ERROR", f"图标下载异常 id={card_id}: {e}")
        return False

    if not resp or resp.status_code != 200:
        log("WARN", f"图标下载失败/未找到 id={card_id}, status={getattr(resp, 'status_code', None)}")
        return False

    try:
        with open(out_path, 'wb') as f:
            f.write(resp.content)
        log("LOG", f"图标下载成功 id={card_id} -> {out_path.name}")
        return True
    except Exception as e:
        log("ERROR", f"写入图标失败 id={card_id}: {e}")
        return False


def download_missing_icons(existing_ids: set[int], all_card_ids: set[int], icons_dir: Path) -> int:
    """
    计算缺失 id 并下载：
    1) 全量差集补历史缺口：all_card_ids - existing_ids
    2) 顺延补齐：从 max(existing_ids)+1 一直到 max(all_card_ids)
       （在 1) 已包含的情况下，这一步可能为空；两者合并去重处理）
    返回成功下载的数量。
    """
    if not all_card_ids:
        return 0

    # 差集：历史缺口
    missing = set(all_card_ids) - set(existing_ids)

    # 顺延：从当前已存在的最大 id + 1 到最新 id
    if existing_ids:
        seq_start = max(existing_ids) + 1
    else:
        seq_start = min(all_card_ids)  # 目录为空时，从现有最小卡 id 开始
    seq_end = max(all_card_ids)
    if seq_start <= seq_end:
        missing |= set(range(seq_start, seq_end + 1))

    # 只对确实存在的卡 id 做尝试（防止构造出不在 CSV 的 id）
    missing = sorted([i for i in missing if i in all_card_ids])

    ok = 0
    for cid in missing:
        if download_icon_for_id(cid, icons_dir):
            ok += 1
    return ok

# ====== 工具函数 ======
def read_last_value_from_csv(csv_path, field):
    if not os.path.exists(csv_path):
        return 0
    with open(csv_path, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
        if not rows:
            return 0
        vals = []
        for r in rows:
            v = r.get(field)
            if v is not None and str(v).strip().isdigit():
                vals.append(int(v))
        return max(vals) if vals else 0

def read_last_id_from_csv(csv_path):
    return read_last_value_from_csv(csv_path, "id")

def get_start_ids():
    # 卡牌从 character_card.csv 的最大 id + 1
    card_last = read_last_id_from_csv(DATA_DIR / "character_card.csv")
    if LAST_CARD_INFO_FILE.exists():
        txt = LAST_CARD_INFO_FILE.read_text().strip()
        if txt.isdigit():
            card_last = max(card_last, int(txt))
    start_card_id = card_last + 1

    # 特性从两个文件最后 card_id 的最小者 + 1
    give_last = read_last_value_from_csv(DATA_DIR / "card_give_characteristic.csv", "card_id")
    grow_last = read_last_value_from_csv(DATA_DIR / "card_give_characteristic_grow_list.csv", "card_id")
    last_min = None
    if give_last and grow_last:
        last_min = min(give_last, grow_last)
    else:
        last_min = give_last or grow_last or 0
    start_characteristics_id = last_min + 1

    # 若 mismatch 文件有值，优先用更小的作为重抓起点
    if LAST_MISMATCH_FILE.exists():
        text = LAST_MISMATCH_FILE.read_text().strip()
        if text.isdigit():
            start_characteristics_id = min(start_characteristics_id, int(text))

    return start_card_id, start_characteristics_id

def get_alt_title_for_id(card_id):
    with open(DATA_DIR / "character_card.csv", newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            if int(row['id']) == card_id:
                target_title = row['title']
                break
        else:
            raise ValueError(f"找不到 ID={card_id} 的卡片 title")

    resp = requests.get("https://gamerch.com/wizard-promise/117797",
                        headers={'User-Agent': 'Mozilla/5.0'})
    soup = BeautifulSoup(resp.content, 'html.parser')
    img_tag = soup.find('img', alt=lambda x: x and target_title in x)
    if not img_tag:
        raise ValueError(f"找不到 title='{target_title}' 对应的 alt 文本")
    return img_tag['alt']

# ====== 卡信息抓取 ======
def extract_character_info(td_element):
    a_tag = td_element.find('a')
    if not a_tag:
        return None, None
    name_segment = []
    for content in a_tag.contents:
        if getattr(content, 'name', None) == 'ruby':
            break
        if isinstance(content, str):
            name_segment.append(content.strip())
    name = ''.join(name_segment).split('】')[-1].strip()
    if name not in CHARACTER_MAP:
        for char_name in CHARACTER_MAP:
            if char_name in name:
                return char_name, a_tag.get_text(strip=True)
        return None, None
    return name, a_tag.get_text(strip=True)

def process_card_row(tr, current_index):
    img_tag = tr.find('img', alt=True)
    if not img_tag:
        return None
    title_prefix = img_tag['alt'].strip().split('】')[0]
    td_col2 = tr.find('td', class_='mu__table--col2')
    td_col3 = tr.find('td', class_='mu__table--col3')
    char_name, _ = extract_character_info(td_col2)
    char_data = CHARACTER_MAP.get(char_name, None) if char_name else None
    title_full = f"{title_prefix}】{char_name}" if char_name else title_prefix

    row = {
        'id': current_index,
        'title': title_full,
        'character_id': char_data['id'] if char_data else '',
        'rarity': RARITY_MAP.get(td_col3.get_text(strip=True), 2),
        'country': char_data['country_id'] if char_data else '',
        'character_first_name_en': char_data['en'] if char_data else '',
        'series': 'unknown',
        'manually_added': 1
    }
    return row

def export_card_infos(target_alt, start_index, csv_path):
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get("https://gamerch.com/wizard-promise/117797", headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    found_target = False
    current_idx = start_index
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['id','title','character_id','rarity','country','character_first_name_en','series','manually_added']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for tr in soup.find_all('tr'):
            if not found_target:
                # 命中上一张 alt，跳过这一行，从下一行开始写
                if tr.find('img', alt=lambda x: x and target_alt in x):
                    found_target = True
                    log("INFO", f"定位到起点（上一张）: {target_alt} —— 从下一行开始写入")
                    continue
                else:
                    continue

            # 新增：若遇到「仮）」则停止抓取
            img_tag = tr.find('img', alt=True)
            if img_tag:
                alt_text = img_tag['alt'].strip()
                if '（仮）' in alt_text:
                    log("INFO", f"检测到占位用空白卡片，停止卡信息抓取：{alt_text}")
                    break

            row = process_card_row(tr, current_idx)
            if row:
                log("LOG", f"卡信息写入 id={current_idx}, title={row['title']}, rarity={row['rarity']}")
                writer.writerow(row)
                current_idx += 1

# ====== 特性抓取 ======
def retry_request(url, headers=None, retries=3, backoff_factor=0.5, status_forcelist=(500, 502, 503, 504)):
    session = requests.Session()
    retry = Retry(total=retries, read=retries, connect=retries,
                  backoff_factor=backoff_factor, status_forcelist=status_forcelist,
                  raise_on_status=False)
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    for attempt in range(retries):
        try:
            return session.get(url, headers=headers)
        except IncompleteRead:
            time.sleep(backoff_factor * (2 ** attempt))
    raise ConnectionError(f"请求失败: {url}")

def process_characteristic_row(tr):
    img_tag = tr.find('img', alt=True)
    if not img_tag:
        return None
    link_tag = tr.find('td', class_='mu__table--col1').find('a')
    if not link_tag or not link_tag['href']:
        return None
    detail_url = link_tag['href']
    if not detail_url.startswith('http'):
        detail_url = 'https://gamerch.com' + detail_url
    detail_resp = retry_request(detail_url, headers={'User-Agent': 'Mozilla/5.0'})
    detail_soup = BeautifulSoup(detail_resp.content, 'html.parser')
    traits_block = None
    for tr_tag in detail_soup.find_all('tr'):
        if 'パートナー特性' in tr_tag.get_text():
            traits_block = tr_tag
            break
    if not traits_block:
        return None
    traits_td = traits_block.find_next_sibling('tr')
    if not traits_td:
        return None
    traits_text = traits_td.get_text(separator='*', strip=True)
    segments = re.split(r'\(?レベル\d+で解放\)?', traits_text)
    base_traits = []
    growth_traits = []
    if segments:
        base_part = segments[0]
        base_traits = [t.strip('*/ ') for t in base_part.split('/') if t.strip('*/ ')]
    base_traits = [t for t in base_traits if t]
    if base_traits and base_traits[-1].count('*') >= 1:
        c1, c2 = base_traits[-1].split('*')
        base_traits[-1] = c1
        growth_traits.append(c2)
    if len(base_part) > 0:
        for i in range(1, len(segments)):
            if segments[i] and segments[i].strip('*/ '):
                growth_traits.append(segments[i].strip('*/ '))
    return {"基础": base_traits, "成长": growth_traits}

def export_characteristics_json(target_alt, start_index):
    response = retry_request("https://gamerch.com/wizard-promise/117797", headers={'User-Agent': 'Mozilla/5.0'})
    soup = BeautifulSoup(response.content, 'html.parser')
    found_target = False
    current_idx = start_index
    result = {}
    for tr in soup.find_all('tr'):
        if not found_target:
            if tr.find('img', alt=lambda x: x and target_alt in x):
                found_target = True
                log("INFO", f"定位到起点（上一张）: {target_alt} —— 从下一行开始抓取特性")
                continue
            else:
                continue
        row_data = process_characteristic_row(tr)
        if row_data:
            if not row_data["基础"] or not row_data["成长"]:
                name_td = tr.find('td', class_='mu__table--col2')
                name = name_td.get_text(strip=True) if name_td else ""
                row_data["卡牌名"] = name
                log("WARN", f"特性缺失 id={current_idx}, 卡牌名={name}, 基础={row_data['基础']}, 成长={row_data['成长']}")
            else:
                log("LOG", f"特性写入 id={current_idx}, 基础={row_data['基础']}, 成长={row_data['成长']}")
            result[str(current_idx)] = row_data
            current_idx += 1
    return result

# ====== CSV 覆盖工具 ======
def overwrite_from_id_generic(src_csv, dest_csv, key_field, start_id):
    """将 src 追加到 dest，但会先保留 dest 中 key_field < start_id 的旧行，再覆盖写回。"""
    kept_rows = []
    kept_fields = []
    if os.path.exists(dest_csv):
        with open(dest_csv, newline='', encoding='utf-8') as f:
            dest_reader = csv.DictReader(f)
            kept_fields = dest_reader.fieldnames or []
            for r in dest_reader:
                v = r.get(key_field, "")
                if str(v).isdigit() and int(v) < start_id:
                    kept_rows.append(r)
    # 读取新增
    with open(src_csv, newline='', encoding='utf-8') as f:
        src_reader = csv.DictReader(f)
        if not kept_fields:
            kept_fields = src_reader.fieldnames or []
        new_rows = [r for r in src_reader if any((str(v).strip() if v is not None else "") for v in r.values())]
    with open(dest_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=kept_fields)
        writer.writeheader()
        writer.writerows(kept_rows + new_rows)
    log("LOG", f"覆盖写入 {dest_csv}: 保留旧行 {len(kept_rows)}，追加新行 {len(new_rows)}（起点 {key_field}>={start_id}）")

def collect_and_write_permanent_ids(card_info_path: Path, output_path: Path):
    """
    从 character_card.csv 读取 title->id 映射，
    抓取 https://gamerch.com/wizard-promise/175474 页面，
    解析每行卡名匹配到 title，得到 id 列表。
    以“追加模式”更新 permanent.txt：
    只追加当前不存在的 ID，最终升序保存。
    """
    # ===== 读取现有 permanent.txt =====
    existing_ids = set()
    if output_path.exists():
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                for part in f.read().strip().split(","):
                    part = part.strip()
                    if part.isdigit():
                        existing_ids.add(int(part))
            log("INFO", f"已读取现有恒常 ID {len(existing_ids)} 条")
        except Exception as e:
            log("WARN", f"读取 {output_path} 出错，将重新生成: {e}")

    # ===== 读取 character_card.csv，建立 title -> id 映射 =====
    title_to_id = {}
    with open(card_info_path, 'r', encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                card_id = int(row['id'])
            except Exception:
                continue
            title_str = row.get('title', '').strip()
            if title_str:
                title_to_id[title_str] = card_id

    # ===== 抓取页面 =====
    url = "https://gamerch.com/wizard-promise/175474"
    resp = retry_request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    if not resp or resp.status_code != 200:
        raise ConnectionError(f"请求失败，状态码: {getattr(resp, 'status_code', 'unknown')}")

    soup = BeautifulSoup(resp.content, 'html.parser')

    # ===== 解析行 =====
    found_ids = set()
    tr_list = soup.find_all('tr')
    for tr in tr_list:
        td = tr.find('td', class_='mu__table--col2')
        if not td:
            continue
        a_tag = td.find('a')
        if not a_tag:
            continue
        href = a_tag.get('href') or ''
        if 'wizard-promise' not in href:
            continue

        text = (a_tag.text or '').strip()
        if not text or '】' not in text:
            continue

        try:
            left, right = text.split('】', 1)
        except ValueError:
            continue
        title_part = left
        name_part = right

        if name_part not in CHARACTER_MAP:
            for char_name in CHARACTER_MAP:
                if char_name in name_part:
                    name_part = char_name
                    break

        normalized_title = f"{title_part}】{name_part}"

        cid = title_to_id.get(normalized_title)
        if cid is not None:
            found_ids.add(cid)
        else:
            log("WARN", f"恒常列表未命中: {normalized_title}")

    # ===== 计算新增 =====
    new_ids = found_ids - existing_ids
    if new_ids:
        log("INFO", f"发现 {len(new_ids)} 条新增恒常 ID: {sorted(new_ids)}")
    else:
        log("INFO", "没有新增恒常 ID")

    # ===== 合并 & 写回 =====
    all_ids = sorted(existing_ids | found_ids)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        f.write(",".join(map(str, all_ids)))

    log("INFO", f"恒常卡牌 ID 共 {len(all_ids)} 条，已写入: {output_path}")

# ====== 主逻辑 ======
def main():
    start_card_id, start_characteristics_id = get_start_ids()
    log("INFO", f"卡信息起点 ID: {start_card_id}")
    log("INFO", f"特性信息起点 ID: {start_characteristics_id}")

    # 分开计算两套起点的“上一张”的 alt
    alt_title_for_cards = get_alt_title_for_id(start_card_id - 1)
    alt_title_for_chars = get_alt_title_for_id(start_characteristics_id - 1)

    log("INFO", f"获取到【卡信息】起点卡的上一张 alt: {alt_title_for_cards}")
    log("INFO", f"获取到【特性】起点卡的上一张 alt: {alt_title_for_chars}")

    tmp_dir = Path(__file__).resolve().parent / "tmp"
    tmp_dir.mkdir(exist_ok=True)

    # === 卡信息 ===
    tmp_card_info_csv = tmp_dir / "new_character_card.csv"
    export_card_infos(alt_title_for_cards, start_card_id, tmp_card_info_csv)
    overwrite_from_id_generic(tmp_card_info_csv, DATA_DIR / "character_card.csv", "id", start_card_id)

    # === 特性 JSON ===
    tmp_characteristics_json = tmp_dir / "new_characteristics.json"
    characteristics_data = export_characteristics_json(alt_title_for_chars, start_characteristics_id)
    with open(tmp_characteristics_json, 'w', encoding='utf-8') as f:
        json.dump(characteristics_data, f, ensure_ascii=False, indent=4)
    log("INFO", f"已写入临时特性 JSON: {tmp_characteristics_json}")

    # === 生成 give / grow 两个 CSV（内存中先构造） ===
    characteristics_map = {}
    with open(DATA_DIR / "characteristics_normal.csv", 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            characteristics_map[row['title']] = int(row['id'])

    character_card = {}
    with open(DATA_DIR / "character_card.csv", 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            card_id = int(row['id'])
            character_card[card_id] = {
                'rarity': int(row['rarity']),
                'manually_added': row['manually_added']
            }

    give_chars, grow_list = [], []
    for json_id, data in characteristics_data.items():
        card_id = int(json_id)
        exists_in_character_card = card_id in character_card
        manually_added = '1' if not exists_in_character_card else character_card[card_id]['manually_added']

        base_chars = data.get('基础', [])
        for idx, char_name in enumerate(base_chars, 1):
            char_id = characteristics_map.get(char_name)
            give_chars.append({
                'card_id': card_id,
                'No': idx,
                'characteristic_id': char_id if char_id is not None else char_name,
                'manually_added': '1' if char_id is None else manually_added
            })
        grow_chars = data.get('成长', [])
        if exists_in_character_card:
            rarity = character_card[card_id]['rarity']
            if rarity == 2:
                levels = [35, 45, 55, 70]
            elif rarity == 3:
                levels = [15, 40, 65, 75]
            elif rarity == 4:
                levels = [30, 55, 75, 100]
            else:
                levels = []
            for char_name, level in zip(grow_chars, levels):
                char_id = characteristics_map.get(char_name)
                grow_list.append({
                    'card_id': card_id,
                    'level': level,
                    'characteristic_id': char_id if char_id is not None else char_name,
                    'value': '',
                    'manually_added': '1' if char_id is None else '1'
                })

        log("LOG", f"构造 give/grow: card_id={card_id}, base={base_chars}, grow={grow_chars}")

    tmp_give_csv = tmp_dir / "card_give_characteristics.csv"
    tmp_grow_csv = tmp_dir / "card_give_characteristics_grow_list.csv"
    with open(tmp_give_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['card_id', 'No', 'characteristic_id', 'manually_added'])
        writer.writeheader()
        writer.writerows(give_chars)
    with open(tmp_grow_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['card_id', 'level', 'characteristic_id', 'value', 'manually_added'])
        writer.writeheader()
        writer.writerows(grow_list)
    log("INFO", f"已写入临时 CSV: {tmp_give_csv}, {tmp_grow_csv}")

    # === 覆盖更新两个特性 CSV（key_field = card_id） ===
    overwrite_from_id_generic(tmp_give_csv, DATA_DIR / "card_give_characteristic.csv", "card_id", start_characteristics_id)
    overwrite_from_id_generic(tmp_grow_csv, DATA_DIR / "card_give_characteristic_grow_list.csv", "card_id", start_characteristics_id)

    # === 恒常（kojo）id 生成 ===
    try:
        permanent_out = DATA_DIR / "permanent.txt"
        collect_and_write_permanent_ids(DATA_DIR / "character_card.csv", permanent_out)
    except Exception as e:
        log("ERROR", f"生成恒常卡牌列表失败: {e}")

    # === 补全缺失卡图标（public/images/card_icons/Card_icon_<id>.png） ===
    existing_icon_ids = get_existing_icon_ids(ICON_DIR)
    all_card_ids = get_card_ids_from_csv(DATA_DIR / "character_card.csv")
    added_icons = download_missing_icons(existing_icon_ids, all_card_ids, ICON_DIR)
    log("INFO", f"卡图标补全完成：新增 {added_icons} 张（目录={ICON_DIR}）")

    # === 更新状态 ===
    last_id_in_card_info = read_last_id_from_csv(DATA_DIR / "character_card.csv")
    LAST_CARD_INFO_FILE.write_text(str(last_id_in_card_info), encoding='utf-8')

    mismatch_id = None
    for cid, data in characteristics_data.items():
        if "卡牌名" in data:
            mismatch_id = int(cid)
            break
    if mismatch_id:
        LAST_MISMATCH_FILE.write_text(str(mismatch_id), encoding='utf-8')
        log("WARN", f"检测到数据不匹配，从 {mismatch_id} 起的特性将在下次重新抓取")
    else:
        LAST_MISMATCH_FILE.write_text("", encoding='utf-8')

    log("INFO", "更新完成！")

if __name__ == "__main__":
    main()