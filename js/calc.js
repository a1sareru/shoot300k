document.addEventListener("DOMContentLoaded", () => {
    const cardInput = document.getElementById("card-input");
    const submitCalc = document.getElementById("submit-calc");
    const calcError = document.getElementById("calc-error");
    const calcResults = document.getElementById("calc-results");

    // 尝试从 localStorage 读取上次的输入
    const savedIds = localStorage.getItem("cardInput");
    if (savedIds) {
        cardInput.value = savedIds;
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
        const ids = inputText.split(",").map(id => Number(id.trim()));

        // 调用计算函数
        await calculateCardSet(ids);
    });



    // 计算卡组逻辑框架
    async function calculateCardSet(ids) {
        try {
            // 预处理：所有 cardId >= 337 的需要 +19
            const ids19 = ids.map(id => (id >= 337 ? id + 19 : id));
            const filteredIds19 = await filtedCardByIds19(ids19);

            // 读取 JSON 数据
            const fullSolutionResponse = await fetch("https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/artifacts/solutions/full_solution.json");

            if (!fullSolutionResponse.ok) {
                throw new Error("无法加载卡组计算数据");
            }

            const fullSolutionData = await fullSolutionResponse.json();

            let results = []; // 计算出的卡组组合

            // 遍历 fullSolutionData
            for (const solution in fullSolutionData) {
                // solution has "quad" and "card0s"
                const quadCandidate = fullSolutionData[solution]["quad"];
                const card0Candidates = fullSolutionData[solution]["card0s"];
                const tags = fullSolutionData[solution]["tags"];

                if (!quadCandidate || !card0Candidates) continue; // 跳过空数据

                if (card0Candidates.some(id => filteredIds19.includes(id))) {
                    if (quadCandidate.filter(id => filteredIds19.includes(id)).length >= 3) {
                        results.push({
                            quad: quadCandidate,
                            dset: card0Candidates,
                            dset_tag: tags
                        });
                    }
                }
                else if (quadCandidate.every(id => filteredIds19.includes(id))) {
                    results.push({
                        quad: quadCandidate,
                        dset: card0Candidates,
                        dset_tag: tags
                    });
                }
            }

            // 渲染计算结果
            renderCalcResults(calcResults, results, filteredIds19, "pink", "看起来暂时还配不出卡组喏……试试吾等的「予言書（仮）」如何～！");
        } catch (error) {
            document.getElementById("calc-error").textContent = "计算失败，请检查输入或稍后重试";
            document.getElementById("calc-error").style.display = "block";
            console.error(error);
        }
    }
});