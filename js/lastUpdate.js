async function fetchRepoLastUpdated() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/artifacts/repo-last-update');
        if (!response.ok) throw new Error(`Request fail: ${response.status}`);

        const lastUpdated = (await response.text()).trim();

        const el = document.getElementById("repo-last-updated");
        const params = { date: lastUpdated };

        // 设置 data-i18n 和参数缓存
        el.setAttribute("data-i18n", "info.repo-last-updated");
        el.setAttribute("data-i18n-params", JSON.stringify(params));
        el.dataset.i18nParamsCache = JSON.stringify(params);

        // 初次渲染
        el.textContent = getI18n("info.repo-last-updated", params);
    } catch (error) {
        const el = document.getElementById("repo-last-updated");
        el.setAttribute("data-i18n", "info.repo-last-fail");
        el.textContent = getI18n("info.repo-last-fail", {}, "※ 获取失败");
        console.error("fail to load 'last updated' info for the whole project:", error);
    }
}

async function fetchCardDataLastUpdated() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/artifacts/data-last-update');
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const lastUpdated = (await response.text()).trim();
        const lastUpdatedDate = new Date(lastUpdated.replace(/-/g, '/'));
        const currentDate = new Date();
        const diffDays = Math.floor(Math.abs(currentDate - lastUpdatedDate) / (1000 * 60 * 60 * 24));

        const el = document.getElementById("data-last-updated");
        const params = { days: diffDays, date: lastUpdated };

        // 设置 data-i18n 和参数缓存
        el.setAttribute("data-i18n", "info.data-last-updated");
        el.setAttribute("data-i18n-params", JSON.stringify(params));
        el.dataset.i18nParamsCache = JSON.stringify(params);

        // 初次渲染
        el.textContent = getI18n("info.data-last-updated", params);
    } catch (error) {
        const el = document.getElementById("data-last-updated");
        el.setAttribute("data-i18n", "info.data-last-fail");
        el.textContent = getI18n("info.data-last-fail", {}, "（上次更新：获取失败）");
        console.error("fail to load 'last updated' info for card data:", error);
    }
}

// 调用
fetchRepoLastUpdated();
fetchCardDataLastUpdated();