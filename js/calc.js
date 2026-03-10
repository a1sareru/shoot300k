document.addEventListener("DOMContentLoaded", () => {
    const cardInput = document.getElementById("card-input");
    const submitCalc = document.getElementById("submit-calc");
    const calcErrorInvalidInput = document.getElementById("calc-error-invalid-input");
    const calcErrorLoadFailure = document.getElementById("calc-error-load-failure");
    const calcResults = document.getElementById("calc-results");
    const onlyOwnedAllCheckbox = document.getElementById("calc-only-owned-all");

    // 尝试从 localStorage 读取上次的输入
    const savedIds = localStorage.getItem("cardInput");
    if (savedIds) {
        cardInput.value = savedIds;
    }

    // 尝试从 localStorage 读取复选框状态
    const savedOnlyOwnedAll = localStorage.getItem("calcOnlyOwnedAll");
    if (savedOnlyOwnedAll === "true") {
        onlyOwnedAllCheckbox.checked = true;
    }

    // 监听输入框变化，实时保存
    cardInput.addEventListener("input", () => {
        localStorage.setItem("cardInput", cardInput.value.trim());
    });

    // 监听复选框变化，实时保存
    onlyOwnedAllCheckbox.addEventListener("change", () => {
        localStorage.setItem("calcOnlyOwnedAll", onlyOwnedAllCheckbox.checked);
    });

    // 监听提交按钮点击
    submitCalc.addEventListener("click", async () => {
        let inputText = cardInput.value.trim().replace(/\s+/g, '');

        // 检查是否为合法的整数列表
        if (!/^\d+(,\d+)*$/.test(inputText)) {
            calcErrorInvalidInput.textContent = getI18n("calc.error.invalid-input");
            calcErrorInvalidInput.classList.remove("hidden");
            calcErrorInvalidInput.classList.add("visible");
            return;
        }
        calcErrorInvalidInput.classList.add("hidden");
        calcErrorInvalidInput.classList.remove("visible");

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
            const filteredIds19Set = new Set(filteredIds19);

            // 读取 JSON 数据
            const fullSolutionResponse = await fetch("solutions/full_solution.json");

            if (!fullSolutionResponse.ok) {
                throw new Error("无法加载卡组计算数据");
            }

            const fullSolutionData = await fullSolutionResponse.json();

            let results = []; // 计算出的卡组组合

            // 获取复选框状态
            const onlyOwnedAll = onlyOwnedAllCheckbox.checked;

            // 遍历 fullSolutionData
            for (const solution in fullSolutionData) {
                // solution has "quad" and "card0s"
                const quadCandidate = fullSolutionData[solution]["q"];
                const card0Candidates = fullSolutionData[solution]["a"];
                const tags = fullSolutionData[solution]["t"];
                const colors = fullSolutionData[solution]["c"];

                if (!quadCandidate || !card0Candidates) continue; // 跳过空数据

                // 如果勾选了"只显示五张全有"，检查是否全部持有
                if (onlyOwnedAll) {
                    const allFiveCards = [...quadCandidate, ...card0Candidates];
                    const allOwned = allFiveCards.every(id => filteredIds19Set.has(id));
                    if (!allOwned) continue; // 不是全部持有，跳过
                }

                if (card0Candidates.some(id => filteredIds19.includes(id))) {
                    if (quadCandidate.filter(id => filteredIds19.includes(id)).length >= 3) {
                        results.push({
                            quad: quadCandidate,
                            dset: card0Candidates,
                            dset_tag: tags,
                            colors: colors
                        });
                    }
                }
                else if (quadCandidate.every(id => filteredIds19.includes(id))) {
                    results.push({
                        quad: quadCandidate,
                        dset: card0Candidates,
                        dset_tag: tags,
                        colors: colors
                    });
                }
            }

            // 渲染计算结果
            renderCalcResults(calcResults, results, filteredIds19, "pink", getI18n("calc.no-result"));
        } catch (error) {
            document.getElementById("calc-error-load-failure").textContent = getI18n("calc.error.load-failure");
            document.getElementById("calc-error-load-failure").classList.remove("hidden");
            document.getElementById("calc-error-load-failure").classList.add("visible");
            console.error(error);
        }
    }


});