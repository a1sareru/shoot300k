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
            // const processedIds = cardIds.map(id => (id >= 337 ? id + 19 : id));
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
            renderResults(results);
        } catch (error) {
            document.getElementById("calc-error").textContent = "计算失败，请检查输入或稍后重试";
            document.getElementById("calc-error").style.display = "block";
            console.error(error);
        }
    }

    async function renderResults(results) {
        calcResults.innerHTML = "";

        if (results.length === 0) {
            calcResults.innerHTML = "<p>未找到符合条件的卡组</p>";
            return;
        }

        // **确保 `cardMap` 先填充**
        const cards = await fetchAndParseCards();
        const cardMap = new Map(cards.map(card => [String(card.id), card]));

        results.forEach(group => {
            const groupDiv = document.createElement("div");
            groupDiv.classList.add("result-group");

            // 卡组显示区域
            const cardContainer = document.createElement("div");
            cardContainer.classList.add("card-container");

            // 处理四元组数据 (quad) -> 4 张卡片
            group.quad.forEach(cardId => {
                // const displayId = cardId >= 337 ? cardId - 19 : cardId;
                const cardElement = createCardElement(cardId, cardMap);
                if (cardElement) {
                    cardContainer.appendChild(cardElement);
                }
            });

            // 处理 set 数据
            let setCards = Array.isArray(group.set) ? group.set : [group.set];
            if (setCards.length > 0) {
                const setCardDiv = document.createElement("div");
                setCardDiv.classList.add("card-with-info-and-tags", "set-card-container");

                setCards.forEach(cardId => {
                    // const displayId = cardId >= 337 ? cardId - 19 : cardId;
                    const setCardFigure = createCardElement(cardId, cardMap);
                    if (setCardFigure) {
                        setCardDiv.appendChild(setCardFigure);
                    }
                });

                cardContainer.appendChild(setCardDiv);
            }

            groupDiv.appendChild(cardContainer);
            calcResults.appendChild(groupDiv);
        });
    }

    // 生成卡片 HTML 结构，尽可能保持和 cardManager.js 格式一致
    function createCardElement(cardId, cardMap) {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card-with-info-and-tags");

        // **检查 `cardMap` 是否已填充**
        if (!cardMap || cardMap.size === 0) {
            console.error("cardMap 还未填充，跳过卡片:", cardId);
            return null;  // 返回 `null` 而不是 `undefined`
        }

        // 获取卡片信息
        const cardInfo = cardMap.get(String(cardId));
        if (!cardInfo) {
            console.error(`卡片 ID ${cardId} 未找到！`);
            return null;  // 避免 `appendChild(undefined)`
        }

        const cardImgSrc = `https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/images/cards/${cardId}.jpg`;

        // 创建卡片 figure 结构
        cardDiv.innerHTML = `
            <figure>
              <img src="${cardImgSrc}" alt="${cardInfo.title}" class="card-img"
                  onerror="this.src='https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/images/cards/placeholder.jpg';" />
              <figcaption>${formatCardTitle(cardInfo)}</figcaption>
            </figure>
        `;

        return cardDiv;
    }

});