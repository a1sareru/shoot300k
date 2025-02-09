document.addEventListener("DOMContentLoaded", () => {
    const cardInput = document.getElementById("card-input");
    const submitCalc = document.getElementById("submit-calc");
    const calcError = document.getElementById("calc-error");
    const calcResults = document.getElementById("calc-results");

    // 尝试从 localStorage 读取上次的输入
    const savedCardIds = localStorage.getItem("cardInput");
    if (savedCardIds) {
        cardInput.value = savedCardIds;
    }

    // 监听输入框变化，实时保存
    cardInput.addEventListener("input", () => {
        localStorage.setItem("cardInput", cardInput.value.trim());
    });

    // 监听提交按钮点击
    submitCalc.addEventListener("click", async () => {
        let inputText = cardInput.value.trim().replace(/\s+/g, '');

        // 检查是否为合法的整数列表
        if (!/^\d+(,\d+)*$/.test(inputText)) {
            calcError.textContent = "请输入合法的卡牌ID列表，使用英文逗号分隔";
            calcError.style.display = "block";
            return;
        }
        calcError.style.display = "none";

        // 在提交时更新 localStorage
        localStorage.setItem("cardInput", inputText);

        // 解析卡牌ID列表
        const cardIds = inputText.split(",").map(id => Number(id.trim()));

        // 调用计算函数
        await calculateCardSet(cardIds);
    });

    // 过滤出 SR (3) 和 SSR (4) 级别的卡牌
    async function loadCards(inputIds) {
        const cards = await fetchAndParseCards();
        const filteredCards = filterHighRarityCards(cards);
        return inputIds.filter(id => new Set(filteredCards.map(card => card.id)).has(String(id)));
    }

    // 计算卡组逻辑框架
    async function calculateCardSet(cardIds) {
        try {
            // 预处理：所有 cardId >= 337 的需要 +19
            const inputIds = cardIds.map(id => (id >= 337 ? id + 19 : id));
            const processedIds = await loadCards(inputIds);

            // 读取 JSON 数据
            const card0Response = await fetch("https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/artifacts/solutions/card0.json");
            const quadResponse = await fetch("https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/artifacts/solutions/quad.json");

            if (!card0Response.ok || !quadResponse.ok) {
                throw new Error("无法加载卡组计算数据");
            }

            const card0Data = await card0Response.json();
            const quadData = await quadResponse.json();

            let results = []; // 计算出的卡组组合
            let results_with_borrow = [];
            // 遍历 card0Data 和 quadData
            for (const colorPair in card0Data) {
                if (!(colorPair in quadData)) continue; // 只处理两个JSON中都存在的颜色对

                for (const tagPair in card0Data[colorPair]) {
                    if (!(tagPair in quadData[colorPair])) continue; // 只处理两个JSON中都存在的标签对

                    const card0Candidates = card0Data[colorPair][tagPair];  // 这里是四元组列表
                    const quadCandidates = quadData[colorPair][tagPair]; // 这里是普通整数列表

                    if (!card0Candidates || !quadCandidates) continue; // 跳过空数据

                    // 遍历四元组列表和整数列表
                    for (const quadCandidate of quadCandidates) {
                        if (card0Candidates.some(id => processedIds.includes(id))) {
                            if (quadCandidate.filter(id => processedIds.includes(id)).length >= 3) {
                                results.push({
                                    quad: quadCandidate,
                                    set: card0Candidates,
                                    set_tag: tagPair
                                });
                            }
                        } else if (quadCandidate.every(id => processedIds.includes(id))) {
                            results_with_borrow.push({
                                quad: quadCandidate,
                                set: card0Candidates,
                                set_tag: tagPair
                            });
                        }
                    }
                }
            }

            // 渲染计算结果
            renderResults(results, processedIds);
        } catch (error) {
            document.getElementById("calc-error").textContent = "计算失败，请检查输入或稍后重试";
            document.getElementById("calc-error").style.display = "block";
            console.error(error);
        }
    }


    async function renderResults(results, processedIds) {
        calcResults.innerHTML = "";

        if (results.length === 0) {
            calcResults.innerHTML = "<p>未找到符合条件的卡组</p>";
            return;
        }

        // 确保 `cardMap` 先填充
        const cards = await fetchAndParseCards();
        const cardMap = new Map(cards.map(card => [String(card.id), card]));
        const ownedCardIds = new Set(processedIds); // 转换为 Set 以便快速查询
        const cardTags = await fetchAndParseCardTags(); // 解析卡片的 rarity=3 特性

        results.forEach(async group => { // 修改这里，forEach 里使用 async
            const groupDiv = document.createElement("div");
            groupDiv.classList.add("result-group");

            // 卡组显示区域
            const cardContainer = document.createElement("div");
            cardContainer.classList.add("card-container");

            // 处理四元组数据 (quad) -> 4 张卡片
            for (const cardId of group.quad) {
                const cardElement = await createCardElement(cardId, cardMap, ownedCardIds, cardTags, false); // ❶ 关闭 tag 显示
                if (cardElement) {
                    cardContainer.appendChild(cardElement);
                }
            }

            // 处理 set 数据
            let setCards = Array.isArray(group.set) ? group.set.filter(id => ownedCardIds.has(id)) : [];
            if (setCards.length > 0) {
                const setCardDiv = document.createElement("div");
                setCardDiv.classList.add("card-with-info-and-tags", "set-card-container");

                // ❷ 解析 set_tag 并获取 tag 图片
                if (group.set_tag) {
                    const tagsContainer = document.createElement("div");
                    tagsContainer.classList.add("tags-container");

                    const tagIds = group.set_tag.split(",").map(tag => tag.trim()); // 解析 "x,y" 结构
                    tagIds.forEach(tagId => {
                        const tagImg = document.createElement("img");
                        tagImg.src = `https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/images/characteristics/${tagId}.png`;
                        tagImg.classList.add("tag-img");
                        tagsContainer.appendChild(tagImg);
                    });

                    setCardDiv.appendChild(tagsContainer);
                }

                // ❸ 生成 set 内的卡片，但不再显示 tag
                for (const cardId of setCards) {
                    const setCardFigure = await createCardElement(cardId, cardMap, ownedCardIds, cardTags, true); // ❹ 关闭 tag 显示
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

    async function createCardElement(cardId, cardMap, ownedCardIds, cardTags, hideTags = false) {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card-with-info-and-tags");

        // 获取卡片信息
        const cardInfo = cardMap.get(String(cardId));
        if (!cardInfo) {
            console.error(`卡片 ID ${cardId} 未找到！`);
            return null;
        }

        const cardImgSrc = `https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/images/cards/${cardId}.jpg`;

        // 获取稀有度（rarity），确保它是 3 或 4
        const rarity = cardInfo.rarity;
        if (rarity === '3') {
            cardDiv.classList.add("rarity-3");
        } else if (rarity === '4') {
            cardDiv.classList.add("rarity-4");
        }

        // 检查用户是否持有此卡，如果未持有，边框设为粉色
        if (!ownedCardIds.has(cardId)) {
            cardDiv.style.border = "4px solid pink";
        }

        // 如果 hideTags 为 false，才显示 tag
        if (!hideTags) {
            const tagsContainer = document.createElement("div");
            tagsContainer.classList.add("tags-container");

            const rarity3Tags = cardTags.get(String(cardId)) || new Set();
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
            <img src="${cardImgSrc}" alt="${cardInfo.title}" class="card-img"
                onerror="this.src='https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/images/cards/placeholder.jpg';" />
            <figcaption>${formatCardTitle(cardInfo)}</figcaption>
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

});