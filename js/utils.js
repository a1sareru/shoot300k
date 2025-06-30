const kojoIds19 = [
2,3,4,5,6,9,10,11,12,14,15,16,17,18,20,21,22,23,24,26,27,28,29,30,32,33,34,35,36,38,39,40,41,42,44,45,46,47,48,50,51,52,53,54,56,57,58,59,60,62,63,64,65,66,68,69,70,71,72,74,75,76,77,78,80,81,82,83,84,86,87,88,89,90,92,93,94,95,96,98,99,100,101,102,104,105,106,107,108,110,111,112,113,114,116,117,118,119,120,122,123,124,125,126,129,132,133,135,138,139,140,141,144,146,148,149,151,152,153,156,157,158,159,161,165,166,168,169,170,172,184,185,186,189,191,211,212,213,216,217,230,231,232,234,237,248,249,250,251,265,266,267,269,271,274,275,276,277,280,292,293,294,296,298,310,311,312,314,317,328,329,330,333,334,380,381,382,383,387,388,389,390,393,395,409,410,411,413,417,428,429,430,432,434,446,447,448,449,452,480,481,482,483,486,499,500,501,502,505,520,521,522,523,527,529,530,531,532,537,551,552,553,555,558,570,571,572,575,576,592,593,594,597,599,624,625,628,629,631,632,633,635,637,658,659,660,661,664,677,678,682,685,696,697,698,699,703,725,726,727,729,731,751,752,753,755,758,759,760,761,762,766,768,769,770,772,775,786,787,788,790,793,804,805,806,807,810,835,836,837,838,842,852,853,854,856,858,913,914,915,918,920,944,946,949,951,966,967,968,969,972,1029,1030,1031,1033,1035,1053,1054,1055,1056,1059,1073,1074,1075,1076,1079,1126,1127,1128,1130,1133,1161,1162,1163,1166,1167,1195,1196,1197,1198,1202,1252,1253,1254,1255,1258,1306,1307,1308,1311,1312,1326,1327,1328,1331,1333,1345,1346,1347,1348,1352
];

const mahopaIds19 = [
    // #1
    397, 398, 399, 400, 464, 465, 466, 467, 468, 507, 508, 509, 510, 546,
    547, 548, 549, 578, 579, 580, 581,
    // #2
    844, 845, 846, 847, 909, 910, 911, 912, 931, 932, 933, 934, 953, 954,
    955, 956, 974, 975, 976, 977, 978
];

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

// 将banner文本处理为display需要的文本
function formatBannerText(banner, id_19 = 0) {
    let formattedBanner = `<br><br><span class="card-banner`;
    let bannerText = banner;

    // 预处理：删去adult_前缀
    if (bannerText.startsWith("adult_")) {
        bannerText = bannerText.substring(6);
    }

    /* 匹配处理 */
    // 恒常カード
    if (bannerText === "kojo") {
        formattedBanner += ` card-banner-kojo">`;
        formattedBanner += `🪨 恒常`;
    }
    // 不定期
    else if (bannerText.startsWith("sanrio_")) { // sanrio (note: the season event should be excluded)
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🎀 三丽鸥联动`;
    } else if (bannerText.startsWith("rensen")) { // rensen
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🌱 Caulis`;
    } else if (bannerText === "robe" || mahopaIds19.includes(id_19)) { // mahopa
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🥳 魔法趴`;
    } else if (bannerText === "sonatine+") { // sonatine+
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🎻 奏鸣曲`;
    }
    // 定期
    else if (bannerText === "1st"
        || bannerText === "2nd"
        || bannerText === "3rd"
        || bannerText === "4th"
        || bannerText === "5th"
        || bannerText === "6th"
        || bannerText === "7th"
        || bannerText === "8th"
        || bannerText === "9th"
        || bannerText === "10th"
        // 等魔法使的约定真能活这么久再说👋
    ) { // anniversary
        let year_id = bannerText.substring(0, bannerText.length - 2);
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🎈 ${year_id}周年`;
    } else if (bannerText.startsWith("bd_")) { // BD
        // example: bd_201912
        let year_full = bannerText.substring(3, 7);
        let year = year_full.substring(2, 4);
        let month = bannerText.substring(7, 9);
        let year_id = year_full - 2019;
        if (month === "12") {
            year_id += 1;
        }
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🎂 ${year}年诞生日`;
        formattedBanner += `<br>`;
        formattedBanner += `[第${year_id}轮]`;
    } else if (bannerText.startsWith("vd_")) { // VD
        let year = bannerText.substring(5, 7);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🍫 ${year}年情人节`;
        formattedBanner += `<br>`;
        formattedBanner += `[第${year_id}轮]`;
    } else if (bannerText.startsWith("wd_")) { // WD
        let year = bannerText.substring(5, 7);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🍬 ${year}年白情`;
        formattedBanner += `<br>`;
        formattedBanner += `[第${year_id}轮]`;
    } else if (bannerText.startsWith("af_")) { // AF
        let year = bannerText.substring(5, 7);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🤡 ${year}年愚人节`;
        formattedBanner += `<br>`;
        formattedBanner += `[第${year_id}轮]`;
    } else if (bannerText.startsWith("warupurugis_")) { // warupurugis
        let year = bannerText.substring(14, 16);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🧙‍♀️ ${year}年瓦夜`;
        formattedBanner += `<br>`;
        formattedBanner += `[第${year_id}轮]`;
    } else if (bannerText.startsWith("jb_")) { // JB
        let year = bannerText.substring(5, 7);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `💍 ${year}年 Something Gift`;
        formattedBanner += `<br>`;
        formattedBanner += `[第${year_id}轮]`;
    } else if (bannerText.startsWith("propose_")) { // JB -propose
        let year = bannerText.substring(10, 12);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `💍 ${year}年 Something Gift`;
        formattedBanner += `<br>`;
        formattedBanner += `[第${year_id}轮]`;
    } else if (bannerText.startsWith("tanabata_")) { // tanabata
        let year = bannerText.substring(11, 13);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🎋 ${year}年七夕`;
        formattedBanner += `<br>`;
        formattedBanner += `[第${year_id}轮]`;
    } else if (bannerText.startsWith("summer_")) { // summer
        let year = bannerText.substring(9, 11);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `⛱️ ${year}年夏活`;
        formattedBanner += `<br>`;
        formattedBanner += `[第${year_id}轮]`;
    } else if (bannerText.startsWith("halloween_")) { // halloween
        let year = bannerText.substring(12, 14);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `🎃 ${year}年万圣夜`;
        formattedBanner += `<br>`;
        formattedBanner += `[第${year_id}轮]`;
    } else { // not defined
        return "";
    }
    return formattedBanner + `</span>`;
}

// 处理图片路径和标题格式化
function formatCardCaption(card19) {
    // 解析标题，移除 "【" 并拆分 "】" 以获取卡牌名和角色名
    const parts = card19.title.replace(/【/g, '').split("】");
    const cardTitle = parts[0].trim();
    const cardNamae = parts.length > 1 ? fromNamaeGetName(parts[1].trim()) || "" : "";

    // 计算 ID 显示逻辑（id >= 337 需要 -19）
    const displayId = card19.id >= 337 ? card19.id - 19 : card19.id;

    // 组合格式化后的标题
    let formattedTitle = `
        <a href="https://wiki.biligame.com/mahoyaku/Card_${displayId}" target="_blank" rel="noopener noreferrer">
            <strong class="card-title">${cardTitle}</strong>
        </a>
    `;
    if (cardNamae) {
        formattedTitle += `<br>${cardNamae}`;
    }
    let formattedCaption = `${formattedTitle} | ${displayId}`;
    let banner = card19?.series;
    let id19 = +card19.id;
    if (kojoIds19.includes(id19)) {
        banner = "kojo";
    }
    let bannerText = `<br><br><span class="card-banner card-banner-special">❓ 不在恒常池</span>`;
    if (banner) {
        formattedBanner = formatBannerText(banner, id19);
        if (formattedBanner !== "") {
            bannerText = formattedBanner;
        }
    }
    return formattedCaption + bannerText;
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
    const csvText = await loadCSV('public/data/character_card.csv');
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

// 加载 CSV 数据并渲染显示所有卡牌
async function loadCards() {
    const cards = await fetchAndParseCards();
    const filteredCards = filterHighRarityCards(cards);
    renderCards(filteredCards);

    // ✅ 保持选中状态
    restoreSelectedCards(new Set(
        Array.from(document.querySelectorAll(".card.selected")).map(card => card.dataset.id)
    ));

    setupButtons();
}

// 过滤出 SR (3) 和 SSR (4) 级别的卡牌
async function filtedCardByIds19(ids19) {
    const cards19 = await fetchAndParseCards();
    const filteredCards19 = filterHighRarityCards(cards19);
    return ids19.filter(id => new Set(filteredCards19.map(card => card.id)).has(String(id)));
}

// 渲染计算结果
async function renderCalcResults(calcResults, results, ids19, highlightColor = "pink", zeroResultsMessage = "未找到符合条件的卡组") {
    calcResults.innerHTML = "";

    if (results.length === 0) {
        calcResults.innerHTML = "<p>" + zeroResultsMessage + "</p>";
        return;
    }

    const cards19 = await fetchAndParseCards();
    const cardMap19 = new Map(cards19.map(card => [String(card.id), card]));
    const ids19Set = new Set(ids19); // 用户持有的卡片
    const cardTags = await fetchAndParseCardTags(); // 解析卡片特性

    results.forEach(async group => {
        const groupDiv = document.createElement("div");
        groupDiv.classList.add("result-group");
        console.log("group.colors: ", group.colors);
        group.colors.split(',').forEach(id => groupDiv.classList.add('s30k-res-color-' + id.trim()));

        const cardContainer = document.createElement("div");
        cardContainer.classList.add("card-container");

        // 处理四元组数据 (quad) -> 4 张卡片
        for (const id19 of group.quad) {
            const cardElement = await createCardElement(id19, cardMap19, ids19Set, cardTags, false, highlightColor);
            if (cardElement) {
                cardContainer.appendChild(cardElement);
            }
        }

        let filteredIdsDsetSet = Array.isArray(group.dset) ? group.dset.filter(id => ids19Set.has(id)) : [];
        if (filteredIdsDsetSet.length === 0) {
            filteredIdsDsetSet = group.dset;
        }

        // 处理 set 数据
        if (filteredIdsDsetSet.length === 1) {
            // 只有一个卡牌时，按普通 card 方式处理
            const soloId19 = filteredIdsDsetSet[0];
            const singleCardElement = await createCardElement(soloId19, cardMap19, ids19Set, cardTags, false, highlightColor);
            if (singleCardElement) {
                cardContainer.appendChild(singleCardElement); // 直接放入普通卡区域
            }
        } else if (filteredIdsDsetSet.length > 1) {
            // 多个 set 内卡牌，仍然作为 set-card-container 处理
            const setCardDiv = document.createElement("div");
            setCardDiv.classList.add("card-with-info-and-tags", "set-card-container");

            if (group.dset_tag) {
                const tagsContainer = document.createElement("div");
                tagsContainer.classList.add("tags-container");

                const tagIds = group.dset_tag.split(",").map(tag => tag.trim());
                tagIds.forEach(tagId => {
                    const tagImg = document.createElement("img");
                    tagImg.src = `public/images/characteristics/${tagId}.png`;
                    tagImg.classList.add("tag-img");
                    tagsContainer.appendChild(tagImg);
                });

                setCardDiv.appendChild(tagsContainer);
            }

            for (const id19 of filteredIdsDsetSet) {
                const setCardFigure = await createCardElement(id19, cardMap19, ids19Set, cardTags, true, highlightColor);
                if (setCardFigure) {
                    setCardDiv.appendChild(setCardFigure);
                }
            }

            cardContainer.appendChild(setCardDiv);
        }

        groupDiv.appendChild(cardContainer);
        calcResults.appendChild(groupDiv);
    });
}


async function createCardElement(id19, cardMap19, ownedIds19, cardTags, hideTags = false, color = "pink") {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card-with-info-and-tags");

    // 获取卡片信息
    const cardInfo19 = cardMap19.get(String(id19));
    if (!cardInfo19) {
        console.error(`卡片 ID ${id19} 未找到！`);
        return null;
    }

    // 计算显示时的ID
    const displayId = id19 >= 337 ? id19 - 19 : id19;

    const cardImgSrc = `public/images/cards/${id19}.jpg`;
    const cardLink = `https://wiki.biligame.com/mahoyaku/Card_${displayId}`;

    // 获取稀有度（rarity），确保它是 3 或 4
    const rarity = cardInfo19.rarity;
    if (rarity === '3') {
        cardDiv.classList.add("rarity-3");
    } else if (rarity === '4') {
        cardDiv.classList.add("rarity-4");
    }

    // 检查用户是否持有此卡，如果未持有，边框设为指定颜色
    if (!ownedIds19.has(id19)) {
        cardDiv.style.border = "4px solid " + color;
    }

    // 如果 hideTags 为 false，才显示 tag
    if (!hideTags) {
        const tagsContainer = document.createElement("div");
        tagsContainer.classList.add("tags-container");

        const rarity3Tags = cardTags.get(String(id19)) || new Set();
        rarity3Tags.forEach(tagId => {
            const tagImg = document.createElement("img");
            tagImg.src = `public/images/characteristics/${tagId}.png`;
            tagImg.classList.add("tag-img");
            tagsContainer.appendChild(tagImg);
        });

        cardDiv.appendChild(tagsContainer);
    }

    // 创建卡片 figure 结构
    const figure = document.createElement("figure");
    const figureCaption = formatCardCaption(cardInfo19);
    figure.innerHTML = `
        <a href="${cardLink}" target="_blank" rel="noopener noreferrer">
            <img src="${cardImgSrc}" alt="${cardInfo19.title}" class="card-img"
                onerror="this.src='public/images/images/miscs/placeholder.png';" />
        </a>
        <figcaption>${figureCaption}</figcaption>
    `;

    cardDiv.appendChild(figure);
    return cardDiv;
}

async function fetchAndParseCardTags() {
    const urls = [
        "public/data/card_give_characteristic.csv",
        "public/data/card_give_characteristic_grow_list.csv"
    ];

    const rarityDataUrl = "public/data/characteristics_normal.csv";

    const cardTags = new Map(); // cardId -> Set(tagId)
    const rarity3Tags = new Set(); // 存储 rarity=3 的 tagId

    // 先获取 rarity=3 的 tagId
    const rarityResponse = await fetch(rarityDataUrl);
    if (!rarityResponse.ok) {
        console.error("无法加载特性稀有度数据");
        return cardTags;
    }
    const rarityText = await rarityResponse.text();
    const rarityRows = rarityText.split("\n").map(row => row.split(","));

    rarityRows.forEach(row => {
        if (row.length < 2) return; // 需要至少有 rarity 和 tagId
        const tagId = row[0].trim(); // tagId 在第一列
        const rarity = row[3].trim(); // rarity 在第二列
        if (rarity === "3") {
            rarity3Tags.add(tagId);
        }
    });

    // 处理 card -> tag 数据
    for (const url of urls) {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`无法加载卡片特性数据: ${url}`);
            continue;
        }
        const text = await response.text();
        const rows = text.split("\n").map(row => row.split(","));

        rows.forEach(row => {
            if (row.length < 3) return; // 需要至少有3列数据
            const cardId = row[0].trim();
            const tagId = row[2].trim(); // 第3列是特性ID

            // 仅保留 rarity=3 的 tagId
            if (!rarity3Tags.has(tagId)) return;

            if (!cardTags.has(cardId)) {
                cardTags.set(cardId, new Set());
            }
            cardTags.get(cardId).add(tagId);
        });
    }

    return cardTags; // 返回 cardId -> Set(tagId) 的映射
}