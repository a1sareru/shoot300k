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
function formatCardTitle(card19) {
    // 解析标题，移除 "【" 并拆分 "】" 以获取卡牌名和角色名
    const parts = card19.title.replace(/【/g, '').split("】");
    const cardTitle = parts[0].trim();
    const cardNamae = parts.length > 1 ? fromNamaeGetName(parts[1].trim()) || "" : "";

    // 计算 ID 显示逻辑（id >= 337 需要 -19）
    const formattedId = card19.id >= 337 ? card19.id - 19 : card19.id;

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
                    tagImg.src = `https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/images/characteristics/${tagId}.png`;
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

    const cardImgSrc = `https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/images/cards/${id19}.jpg`;
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
            tagImg.src = `https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/images/characteristics/${tagId}.png`;
            tagImg.classList.add("tag-img");
            tagsContainer.appendChild(tagImg);
        });

        cardDiv.appendChild(tagsContainer);
    }

    // 创建卡片 figure 结构
    const figure = document.createElement("figure");
    figure.innerHTML = `
        <a href="${cardLink}" target="_blank" rel="noopener noreferrer">
            <img src="${cardImgSrc}" alt="${cardInfo19.title}" class="card-img"
                onerror="this.src='https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/images/images/miscs/placeholder.png';" />
        </a>
        <figcaption>${formatCardTitle(cardInfo19)}</figcaption>
    `;

    cardDiv.appendChild(figure);
    return cardDiv;
}

async function fetchAndParseCardTags() {
    const urls = [
        "https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/data/card_give_characteristic.csv",
        "https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/data/card_give_characteristic_grow_list.csv"
    ];

    const rarityDataUrl = "https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/data/characteristics_normal.csv";

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