async function fetchRepoLastUpdated() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/artifacts/repo-last-update');
        if (!response.ok) throw new Error(`Request fail: ${response.status}`);

        const lastUpdated = await response.text();
        document.getElementById("repo-last-updated").textContent = `※ 本站最后更新：${lastUpdated.trim()}`;
    } catch (error) {
        document.getElementById("repo-last-updated").textContent = "※ 获取失败";
        console.error("fail to load 'last updated' info for the whole project:", error);
    }
}

// 立即调用
fetchRepoLastUpdated();

async function fetchCardDataLastUpdated() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/artifacts/data-last-update');
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const lastUpdated = await response.text();
        const lastUpdatedDate = new Date(lastUpdated.trim().replace(/-/g, '/'));
        const currentDate = new Date();

        const diffTime = Math.abs(currentDate - lastUpdatedDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        document.getElementById("data-last-updated").textContent = `（上次更新：${diffDays}天前｜${lastUpdated.trim()}）`;
    } catch (error) {
        document.getElementById("data-last-updated").textContent = "（上次更新：获取失败）";
        console.error("fail to load 'last updated' info for card data:", error);
    }
}

// 调用示例
fetchCardDataLastUpdated();