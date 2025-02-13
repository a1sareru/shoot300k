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



    // 计算卡组逻辑框架
    async function calculateCardSet(cardIds) {
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
            renderCalcResults(calcResults, results, processedIds, "pink", "看起来暂时还配不出卡组喏……试试吾等的「予言書（仮）」如何～！");
        } catch (error) {
            document.getElementById("calc-error").textContent = "计算失败，请检查输入或稍后重试";
            document.getElementById("calc-error").style.display = "block";
            console.error(error);
        }
    }
});