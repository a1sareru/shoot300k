document.addEventListener("DOMContentLoaded", () => {
    const cardInput = document.getElementById("prophecy-card-input");
    const submitCalc = document.getElementById("submit-prophecy-calc");
    const calcError = document.getElementById("prophecy-calc-error");
    const calcResults = document.getElementById("prophecy-calc-results");

    // 尝试从 localStorage 读取上次的输入
    const savedCardIds = localStorage.getItem("prophecyCardInput");
    if (savedCardIds) {
        cardInput.value = savedCardIds;
    }

    // 监听输入框变化，实时保存
    cardInput.addEventListener("input", () => {
        localStorage.setItem("prophecyCardInput", cardInput.value.trim());
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
        localStorage.setItem("prophecyCardInput", inputText);

        // 解析卡牌ID列表
        const cardIds = inputText.split(",").map(id => Number(id.trim()));

        // 调用计算函数
        await calculateProphecyCardSet(cardIds);
    });

    // 计算卡组逻辑框架
    async function calculateProphecyCardSet(cardIds) {
        try {
            // 预处理：所有 cardId >= 337 的需要 +19
            const inputIds = cardIds.map(id => (id >= 337 ? id + 19 : id));
            const processedIds = await filtedCardByIds(inputIds);

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
                if (!(colorPair in quadData)) continue;

                for (const tagPair in card0Data[colorPair]) {
                    if (!(tagPair in quadData[colorPair])) continue;

                    const card0Candidates = card0Data[colorPair][tagPair]; // 这里是四元组列表
                    const quadCandidates = quadData[colorPair][tagPair];  // 这里是普通整数列表

                    if (!card0Candidates || !quadCandidates) continue;

                    flag_they_have_deck = false;

                    // 遍历四元组列表和整数列表（新的逻辑）
                    for (const quadCandidate of quadCandidates) {
                        if (card0Candidates.some(id => processedIds.includes(id))) {
                            if (quadCandidate.filter(id => processedIds.includes(id)).length >= 3) {
                                // FIXME: 防一手贪心贤者酱干爆浏览器（何）
                                flag_they_have_deck = true;
                            } else if (quadCandidate.filter(id => processedIds.includes(id)).length >= 2) {
                                results.push({
                                    quad: quadCandidate,
                                    set: card0Candidates,
                                    set_tag: tagPair
                                });
                            }
                        } else {
                            if (quadCandidate.filter(id => processedIds.includes(id)).length >= 4) {
                                // FIXME: 防一手贪心贤者酱干爆浏览器（何）
                                flag_they_have_deck = true;
                            } else
                                if (quadCandidate.filter(id => processedIds.includes(id)).length >= 3) {
                                    results_with_borrow.push({
                                        quad: quadCandidate,
                                        set: card0Candidates,
                                        set_tag: tagPair
                                    });
                                }
                        }
                    }
                    // 如果没有结果，尝试降低要求
                    if (!flag_they_have_deck && results === 0 && results_with_borrow.length == 0) {
                        for (const quadCandidate of quadCandidates) {
                            if (card0Candidates.some(id => processedIds.includes(id))) {
                                if (quadCandidate.filter(id => processedIds.includes(id)).length >= 1) {
                                    results.push({
                                        quad: quadCandidate,
                                        set: card0Candidates,
                                        set_tag: tagPair
                                    });
                                }
                            } else if (quadCandidate.filter(id => processedIds.includes(id)).length >= 2) {
                                results_with_borrow.push({
                                    quad: quadCandidate,
                                    set: card0Candidates,
                                    set_tag: tagPair
                                });
                            }
                        }
                    }
                }
            }

            // 渲染计算结果
            renderCalcResults(calcResults, results, processedIds, "#88dae3", "无能为力喏……加油攒石头抽卡吧贤者酱！");
        } catch (error) {
            calcError.textContent = "计算失败，请检查输入或稍后重试";
            calcError.style.display = "block";
            console.error(error);
        }
    }
});