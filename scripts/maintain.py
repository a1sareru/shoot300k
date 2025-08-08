#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import json
import os
import sys
import time
import re
import requests
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

# ====== 工具函数 ======
def read_last_id_from_csv(csv_path):
    with open(csv_path, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
        if not rows:
            return 0
        return int(rows[-1]['id'])

def get_start_ids():
    if LAST_CARD_INFO_FILE.exists():
        start_card_id = int(LAST_CARD_INFO_FILE.read_text().strip())
    else:
        start_card_id = read_last_id_from_csv(DATA_DIR / "character_card.csv") + 1

    if LAST_MISMATCH_FILE.exists():
        text = LAST_MISMATCH_FILE.read_text().strip()
        start_characteristics_id = int(text) if text else start_card_id
    else:
        start_characteristics_id = start_card_id
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
    title = img_tag['alt'].strip().split('】')[0]
    td_col2 = tr.find('td', class_='mu__table--col2')
    td_col3 = tr.find('td', class_='mu__table--col3')
    char_name, _ = extract_character_info(td_col2)
    char_data = CHARACTER_MAP.get(char_name, None) if char_name else None
    title += '】' + char_name if char_name else ''
    return [
        current_index,
        title,
        char_data['id'] if char_data else '',
        RARITY_MAP.get(td_col3.get_text(strip=True), 2),
        char_data['country_id'] if char_data else '',
        char_data['en'] if char_data else '',
        'unknown',
        1
    ]

def export_card_infos(target_alt, start_index, csv_path):
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get("https://gamerch.com/wizard-promise/117797", headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    found_target = False
    current_idx = start_index
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id','title','character_id','rarity','country','character_first_name_en','series','manually_added'])
        for tr in soup.find_all('tr'):
            if not found_target:
                if tr.find('img', alt=lambda x: x and target_alt in x):
                    found_target = True
                else:
                    continue
            if row_data := process_card_row(tr, current_idx):
                writer.writerow(row_data)
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
    raise ConnectionError(f"请求失败：{url}")

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
            else:
                continue
        if row_data := process_characteristic_row(tr):
            if not row_data["基础"] or not row_data["成长"]:
                name_td = tr.find('td', class_='mu__table--col2')
                name = name_td.get_text(strip=True) if name_td else ""
                row_data["卡牌名"] = name
            result[str(current_idx)] = row_data
            current_idx += 1
    return result

# ====== CSV 操作 ======
def append_csv(src_csv, dest_csv):
    with open(dest_csv, 'rb+') as f:
        f.seek(0, os.SEEK_END)
        if f.tell() > 0:
            f.seek(-1, os.SEEK_END)
            if f.read(1) != b'\n':
                f.write(b'\n')
    with open(dest_csv, 'a', newline='', encoding='utf-8') as fout, \
         open(src_csv, newline='', encoding='utf-8') as fin:
        reader = csv.reader(fin)
        next(reader)
        writer = csv.writer(fout)
        for row in reader:
            if len(row) >= 8 and row[6] == '':
                row[6] = 'unknown'
            writer.writerow(row)

def overwrite_from_id(src_csv, dest_csv, start_id):
    with open(dest_csv, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    fieldnames = rows[0].keys() if rows else []
    rows = [r for r in rows if int(r['card_id']) < start_id]
    with open(src_csv, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            if any(v.strip() for v in r.values()):
                rows.append(r)
    with open(dest_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

# ====== 主逻辑 ======
def main():
    start_card_id, start_characteristics_id = get_start_ids()
    print(f"[INFO] 卡信息起点 ID: {start_card_id}")
    print(f"[INFO] 特性信息起点 ID: {start_characteristics_id}")
    alt_title = get_alt_title_for_id(start_card_id - 1)
    print(f"[INFO] 获取到起点卡的 alt: {alt_title}")
    tmp_dir = Path(__file__).resolve().parent / "tmp"
    tmp_dir.mkdir(exist_ok=True)

    # 卡信息
    tmp_card_info_csv = tmp_dir / "new_character_card.csv"
    export_card_infos(alt_title, start_card_id, tmp_card_info_csv)
    append_csv(tmp_card_info_csv, DATA_DIR / "character_card.csv")

    # 特性
    tmp_characteristics_json = tmp_dir / "new_characteristics.json"
    characteristics_data = export_characteristics_json(alt_title, start_characteristics_id)
    with open(tmp_characteristics_json, 'w', encoding='utf-8') as f:
        json.dump(characteristics_data, f, ensure_ascii=False, indent=4)

    # 调用 getCardGiveCharacteristics 的逻辑
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
                'characteristic_id': char_id if char_id else char_name,
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
                continue
            for char_name, level in zip(grow_chars, levels):
                char_id = characteristics_map.get(char_name)
                grow_list.append({
                    'card_id': card_id,
                    'level': level,
                    'characteristic_id': char_id if char_id else char_name,
                    'value': '',
                    'manually_added': '1' if char_id is None else '1'
                })
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

    # 覆盖更新特性文件
    overwrite_from_id(tmp_give_csv, DATA_DIR / "card_give_characteristic.csv", start_characteristics_id)
    overwrite_from_id(tmp_grow_csv, DATA_DIR / "card_give_characteristic_grow_list.csv", start_characteristics_id)

    # 更新状态
    last_id_in_card_info = read_last_id_from_csv(DATA_DIR / "character_card.csv")
    LAST_CARD_INFO_FILE.write_text(str(last_id_in_card_info), encoding='utf-8')
    mismatch_id = None
    for cid, data in characteristics_data.items():
        if "卡牌名" in data:
            mismatch_id = int(cid)
            break
    if mismatch_id:
        LAST_MISMATCH_FILE.write_text(str(mismatch_id), encoding='utf-8')
        print(f"[WARN] 检测到数据不匹配，从 {mismatch_id} 起的特性将在下次重新抓取")
    else:
        LAST_MISMATCH_FILE.write_text("", encoding='utf-8')

    print("[INFO] 更新完成！")

if __name__ == "__main__":
    main()