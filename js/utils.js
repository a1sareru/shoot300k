let kojoIds19 = [];

async function loadKojoIds19() {
    try {
        const resp = await fetch('public/data/permanent.txt', { cache: 'no-store' });
        if (!resp.ok) throw new Error('无法加载 permanent.txt');
        const text = await resp.text();
        // 支持逗号或任意空白分隔
        kojoIds19 = text
            .trim()
            .split(/[,\s]+/)
            .map(s => parseInt(s, 10))
            .filter(n => Number.isFinite(n));
        console.log('恒常卡牌 ID 已加载：', kojoIds19.length);
    } catch (e) {
        console.error('加载 kojoIds19 失败：', e);
        kojoIds19 = [];
    }
}

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
        formattedBanner += `<i class='oma oma-rock'></i> <span data-i18n="card.banner.kojo">${getI18n("card.banner.kojo")}</span>`;
    }
    // 不定期
    else if (bannerText.startsWith("sanrio_")) { // sanrio (note: the season event should be excluded)
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-ribbon'></i> <span data-i18n="card.banner.sanrio">${getI18n("card.banner.sanrio")}</span>`;
    } else if (bannerText.startsWith("rensen")) { // rensen
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-seedling'></i> <span data-i18n="card.banner.caulis">${getI18n("card.banner.caulis")}</span>`;
    } else if (bannerText == "pajamas+"|| bannerText === "robe" || mahopaIds19.includes(id_19)) { // mahopa
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-partying-face'></i> <span data-i18n="card.banner.mahopa">${getI18n("card.banner.mahopa")}</span>`;
    } else if (bannerText === "sonatine+") { // sonatine+
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-violin'></i> <span data-i18n="card.banner.sonatine">${getI18n("card.banner.sonatine")}</span>`;
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
        formattedBanner += `<i class="oma oma-balloon"></i> ${year_id}<span data-i18n="card.banner.anniv">${getI18n("card.banner.anniv")}</span>`;
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
        formattedBanner += `<i class='oma oma-birthday-cake'></i> ${year}'<span data-i18n="card.banner.birthday">${getI18n("card.banner.birthday")}</span>`;
        formattedBanner += `<br><span data-i18n="card.banner.roundIndex" data-i18n-params='{"n": ${year_id}}'>${getI18n("card.banner.roundIndex", { n: year_id })}</span>`;
    } else if (bannerText.startsWith("vd_")) { // VD
        let year = bannerText.substring(5, 7);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-chocolate-bar'></i> ${year}'<span data-i18n="card.banner.valentine">${getI18n("card.banner.valentine")}</span>`;
        formattedBanner += `<br><span data-i18n="card.banner.roundIndex" data-i18n-params='{"n": ${year_id}}'>${getI18n("card.banner.roundIndex", { n: year_id })}</span>`;
    } else if (bannerText.startsWith("wd_")) { // WD
        let year = bannerText.substring(5, 7);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-candy'></i> ${year}'<span data-i18n="card.banner.whiteday">${getI18n("card.banner.whiteday")}</span>`;
        formattedBanner += `<br><span data-i18n="card.banner.roundIndex" data-i18n-params='{"n": ${year_id}}'>${getI18n("card.banner.roundIndex", { n: year_id })}</span>`;
    } else if (bannerText.startsWith("af_")) { // AF
        let year = bannerText.substring(5, 7);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-clown-face'></i> ${year}'<span data-i18n="card.banner.aprilfool">${getI18n("card.banner.aprilfool")}</span>`;
        formattedBanner += `<br><span data-i18n="card.banner.roundIndex" data-i18n-params='{"n": ${year_id}}'>${getI18n("card.banner.roundIndex", { n: year_id })}</span>`;
    } else if (bannerText.startsWith("warupurugis_")) { // warupurugis
        let year = bannerText.substring(14, 16);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-woman-mage'></i> ${year}'<span data-i18n="card.banner.walpurugis">${getI18n("card.banner.walpurugis")}</span>`;
        formattedBanner += `<br><span data-i18n="card.banner.roundIndex" data-i18n-params='{"n": ${year_id}}'>${getI18n("card.banner.roundIndex", { n: year_id })}</span>`;
    } else if (bannerText.startsWith("jb_")) { // JB
        let year = bannerText.substring(5, 7);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-ring'></i> ${year}'<span data-i18n="card.banner.propose">${getI18n("card.banner.propose")}</span>`;
        formattedBanner += `<br><span data-i18n="card.banner.roundIndex" data-i18n-params='{"n": ${year_id}}'>${getI18n("card.banner.roundIndex", { n: year_id })}</span>`;
    } else if (bannerText.startsWith("propose_")) { // JB -propose
        let year = bannerText.substring(10, 12);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-ring'></i> ${year}'<span data-i18n="card.banner.propose">${getI18n("card.banner.propose")}</span>`;
        formattedBanner += `<br><span data-i18n="card.banner.roundIndex" data-i18n-params='{"n": ${year_id}}'>${getI18n("card.banner.roundIndex", { n: year_id })}</span>`;
    } else if (bannerText.startsWith("tanabata_")) { // tanabata
        let year = bannerText.substring(11, 13);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-tanabata-tree'></i> ${year}'<span data-i18n="card.banner.tanabata">${getI18n("card.banner.tanabata")}</span>`;
        formattedBanner += `<br><span data-i18n="card.banner.roundIndex" data-i18n-params='{"n": ${year_id}}'>${getI18n("card.banner.roundIndex", { n: year_id })}</span>`;
    } else if (bannerText.startsWith("summer_")) { // summer
        let year = bannerText.substring(9, 11);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-umbrella-on-ground'></i> ${year}'<span data-i18n="card.banner.summer">${getI18n("card.banner.summer")}</span>`;
        formattedBanner += `<br><span data-i18n="card.banner.roundIndex" data-i18n-params='{"n": ${year_id}}'>${getI18n("card.banner.roundIndex", { n: year_id })}</span>`;
    } else if (bannerText.startsWith("halloween_")) { // halloween
        let year = bannerText.substring(12, 14);
        let year_id = year - 19;
        formattedBanner += ` card-banner-special">`;
        formattedBanner += `<i class='oma oma-jack-o-lantern'></i> ${year}'<span data-i18n="card.banner.halloween">${getI18n("card.banner.halloween")}</span>`;
        formattedBanner += `<br><span data-i18n="card.banner.roundIndex" data-i18n-params='{"n": ${year_id}}'>${getI18n("card.banner.roundIndex", { n: year_id })}</span>`;
    } else if (bannerText == "unknown") { // unknown
        formattedBanner += ` card-banner-unknown">`;
        formattedBanner += `<span data-i18n="card.banner.unknown">${getI18n("card.banner.unknown")}</span>`;
    }
    else { // not defined
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
    let bannerText = `<br><br><span class="card-banner card-banner-special"><i class='oma oma-red-question-mark'></i> <span data-i18n="card.banner.not-kojo">${getI18n("card.banner.not-kojo")}</span></span>`;
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
    await loadKojoIds19();
    const cards = await fetchAndParseCards();
    const filteredCards = filterHighRarityCards(cards);
    renderCards(filteredCards);

    // 保持选中状态
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
async function renderCalcResults(calcResults, results, ids19, highlightColor = "pink", zeroResultsMessage = "未找到符合条件的卡组",) {
    // 确保恒常卡列表已加载
    await loadKojoIds19();

    calcResults.innerHTML = "";

    if (results.length === 0) {
        calcResults.innerHTML = highlightColor === "pink" ?
            `<p data-i18n="calc.no-result">` + zeroResultsMessage + "</p>" :
            `<p data-i18n="prophecy.no-result">` + zeroResultsMessage + "</p>";
        return;
    }

    calcResults.innerHTML += `
  <div class="s30k-color-filter-buttons" style="font-weight:bold;font-size:14px;margin: 0 auto;text-align: center;">
    <span data-i18n="result.filter.label">${getI18n("result.filter.label")}</span>
    <button data-i18n="result.filter.white" data-filter="s30k-res-color-1" style="background-color:#f9c950;font-weight:bold;">${getI18n("result.filter.white")}</button>
    <button data-i18n="result.filter.red" data-filter="s30k-res-color-2" style="background-color:#f08080;font-weight:bold;">${getI18n("result.filter.red")}</button>
    <button data-i18n="result.filter.green" data-filter="s30k-res-color-3" style="background-color:#77c9a0;font-weight:bold;">${getI18n("result.filter.green")}</button>
    <button data-i18n="result.filter.blue" data-filter="s30k-res-color-4" style="background-color:#6eb8e6;font-weight:bold;">${getI18n("result.filter.blue")}</button>
    <button data-i18n="result.filter.purple" data-filter="s30k-res-color-5" style="background-color:#c5a2f5;font-weight:bold;">${getI18n("result.filter.purple")}</button>
    <span data-i18n="result.filter.show-all.bridge">${getI18n("result.filter.show-all.bridge")}</span>
    <button data-i18n="result.filter.show-all" data-filter="all" style="background-color:#95a5a6;font-weight:bold;">${getI18n("result.filter.show-all")}</button>
  </div>
`;

    document.querySelectorAll('.s30k-color-filter-buttons button').forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            document.querySelectorAll('.result-group').forEach(group => {
                if (filter === 'all') {
                    group.style.display = '';
                } else {
                    group.style.display = group.classList.contains(filter) ? '' : 'none';
                }
            });
        });
    });

    const cards19 = await fetchAndParseCards();
    const cardMap19 = new Map(cards19.map(card => [String(card.id), card]));
    const ids19Set = new Set(ids19); // 用户持有的卡片
    const cardTags = await fetchAndParseCardTags(); // 解析卡片特性

    results.forEach(async group => {
        const groupDiv = document.createElement("div");
        groupDiv.classList.add("result-group");
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

    const cardImgSrc = `public/images/card_icons/Card_icon_${displayId}.png`;
    const cardLink = `https://wiki.biligame.com/mahoyaku/Card_${displayId}`;

    // 获取稀有度（rarity），确保它是 3 或 4
    const rarity = cardInfo19.rarity;
    if (rarity === '3') {
        cardDiv.classList.add("rarity-3");
    } else if (rarity === '4') {
        cardDiv.classList.add("rarity-4");
    }

    // 检查用户是否持有此卡，如果未持有，添加波点标记
    if (!ownedIds19.has(id19)) {
        cardDiv.classList.add(color === "pink" ? "card-unowned-calc" : "card-unowned-prophecy");
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
                onerror="this.onerror=null; this.src='public/images/miscs/placeholder.png';" />
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