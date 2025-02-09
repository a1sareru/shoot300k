// 解析 CSV 文件
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((header, index) => {
            obj[header.trim()] = values[index] ? values[index].trim() : "";
        });
        return obj;
    });
}

// 处理图片路径和标题格式化
function formatCardTitle(card) {
    // 解析标题，移除 "【" 并拆分 "】" 以获取卡牌名和角色名
    const parts = card.title.replace(/【/g, '').split("】");
    const cardTitle = parts[0].trim();
    const cardNamae = parts.length > 1 ? fromNamaeGetName(parts[1].trim()) || "" : "";

    // 计算 ID 显示逻辑（id >= 337 需要 -19）
    const formattedId = card.id >= 337 ? card.id - 19 : card.id;

    // 组合格式化后的标题
    let formattedTitle = `<strong class="card-title">${cardTitle}</strong>`;
    if (cardNamae) {
        formattedTitle += `<br>${cardNamae}`;
    }

    return `${formattedTitle} | ${formattedId}`;
}

// 加载 CSV 数据
async function loadCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('无法加载数据文件');
        return await response.text();
    } catch (error) {
        console.error('CSV 加载错误:', error);
        return null;
    }
}

// 抓取并解析卡牌库数据 (csv)
async function fetchAndParseCards() {
    const csvText = await loadCSV('https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/data/character_card.csv');
    return csvText ? parseCSV(csvText) : [];
}

// 过滤出 SR (3) 和 SSR (4) 级别的卡牌
function filterHighRarityCards(cards) {
    return cards.filter(card => card.rarity.trim() === "4" || card.rarity.trim() === "3");
}

// 根据日文名获取英文名
function fromNamaeGetName(namae) {
    switch (namae) {
        case "オズ": return "Oz";
        case "アーサー": return "Arthur";
        case "カイン": return "Cain";
        case "リケ": return "Riquet";
        case "スノウ": return "Snow";
        case "ホワイト": return "White";
        case "ミスラ": return "Mithra";
        case "オーエン": return "Owen";
        case "ブラッドリー": return "Bradley";
        case "ファウスト": return "Faust";
        case "シノ": return "Shino";
        case "ヒースクリフ": return "Heathcliff";
        case "ネロ": return "Nero";
        case "シャイロック": return "Shylock";
        case "ムル": return "Murr";
        case "クロエ": return "Chloe";
        case "ラスティカ": return "Rustica";
        case "フィガロ": return "Figaro";
        case "ルチル": return "Rutile";
        case "レノックス": return "Lennox";
        case "ミチル": return "Mitile";
        default: return null;
    }
}

