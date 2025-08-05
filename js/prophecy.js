document.addEventListener("DOMContentLoaded", () => {
    const cardInput = document.getElementById("prophecy-card-input");
    const submitCalc = document.getElementById("submit-prophecy-calc");
    const calcErrorInvalidInput = document.getElementById("prophecy-calc-error-invalid-input");
    const calcErrorLoadFailure = document.getElementById("prophecy-calc-error-load-failure");
    const calcResults = document.getElementById("prophecy-calc-results");

    // 尝试从 localStorage 读取上次的输入
    const savedIds = localStorage.getItem("prophecyCardInput");
    if (savedIds) {
        cardInput.value = savedIds;
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
            calcErrorInvalidInput.textContent = getI18n("calc.error.invalid-input");
            calcErrorInvalidInput.style.display = "block";
            return;
        }
        calcErrorInvalidInput.style.display = "none";

        // 在提交时更新 localStorage
        localStorage.setItem("prophecyCardInput", inputText);

        // 解析卡牌ID列表
        const ids = inputText.split(",").map(id => Number(id.trim()));

        // 调用计算函数
        await calculateProphecyCardSet(ids);
    });

    // 计算卡组逻辑框架
    async function calculateProphecyCardSet(ids) {
        try {
            // 预处理：所有 cardId >= 337 的需要 +19
            const ids19 = ids.map(id => (id >= 337 ? id + 19 : id));
            const filteredIds19 = await filtedCardByIds19(ids19);

            // 读取 JSON 数据
            const fullSolutionResponse = await fetch("solutions/full_solution.json");

            if (!fullSolutionResponse.ok) {
                throw new Error("无法加载卡组计算数据");
            }

            const fullSolutionData = await fullSolutionResponse.json();

            let results = []; // 计算出的卡组组合
            let results_weak = []; // 计算出的卡组组合（弱）

            let flag_calc_has_result = false; // calc has results

            // 遍历 fullSolutionData
            for (const solution in fullSolutionData) {
                // solution has "quad" and "card0s"
                const quadCandidate = fullSolutionData[solution]["quad"];
                const card0Candidates = fullSolutionData[solution]["card0s"];
                const tags = fullSolutionData[solution]["tags"];
                const colors = fullSolutionData[solution]["colors"];

                if (!quadCandidate || !card0Candidates) continue; // 跳过空数据

                if (card0Candidates.some(id => filteredIds19.includes(id))) {
                    if (quadCandidate.filter(id => filteredIds19.includes(id)).length >= 3) {
                        // NOTE: 防一手贪心贤者酱干爆浏览器（何）
                        flag_calc_has_result = true;
                    } else if (quadCandidate.filter(id => filteredIds19.includes(id)).length >= 2) {
                        results.push({
                            quad: quadCandidate,
                            dset: card0Candidates,
                            dset_tag: tags,
                            colors: colors
                        });
                    }
                }
                else {
                    if (quadCandidate.filter(id => filteredIds19.includes(id)).length >= 4) {
                        // NOTE: 防一手贪心贤者酱干爆浏览器（何）
                        flag_calc_has_result = true;
                    } else if (quadCandidate.filter(id => filteredIds19.includes(id)).length >= 3) {
                        results.push({
                            quad: quadCandidate,
                            dset: card0Candidates,
                            dset_tag: tags,
                            colors: colors
                        });
                    }
                }

                // 如果没有结果，尝试降低要求
                if (!flag_calc_has_result && results.length === 0) {
                    if (card0Candidates.some(id => filteredIds19.includes(id))) {
                        if (quadCandidate.filter(id => filteredIds19.includes(id)).length >= 1) {
                            results_weak.push({
                                quad: quadCandidate,
                                dset: card0Candidates,
                                dset_tag: tags,
                                colors: colors
                            });
                        }
                    }
                    else if (quadCandidate.filter(id => filteredIds19.includes(id)).length >= 2) {
                        results_weak.push({
                            quad: quadCandidate,
                            dset: card0Candidates,
                            dset_tag: tags,
                            colors: colors
                        });
                    }
                }

            }

            if (!flag_calc_has_result && !results.length && results_weak.length) {
                results = results.concat(results_weak);
            }

            renderCalcResults(calcResults, results, filteredIds19, "#88dae3", getI18n("prophecy.no-result"));
        } catch (error) {
            calcErrorLoadFailure.textContent = getI18n("calc.error.load-failure");
            calcErrorLoadFailure.style.display = "block";
            console.error(error);
        }
    }
});