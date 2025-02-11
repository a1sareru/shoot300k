async function fetchRepoLastUpdated() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/artifacts/repo-last-update');
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const lastUpdated = await response.text(); // Assuming the file contains the last updated date as text
        document.getElementById("repo-last-updated").textContent = `※ 本站最后更新：${lastUpdated}`;
    } catch (error) {
        document.getElementById("repo-last-updated").textContent = "※ 获取失败";
        console.error("获取主工作流最后更新时间失败:", error);
    }
}

// 立即调用
fetchRepoLastUpdated();

async function fetchDataLastUpdated() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/artifacts/data-last-update');
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const lastUpdated = await response.text(); // Assuming the file contains the last updated date as text
        document.getElementById("data-last-updated").textContent = `（卡牌数据最后更新：${lastUpdated}）`;
    } catch (error) {
        document.getElementById("data-last-updated").textContent = "（卡牌数据最后更新：获取失败）";
        console.error("获取卡牌数据最后更新时间失败:", error);
    }
}

// 调用示例
fetchDataLastUpdated();