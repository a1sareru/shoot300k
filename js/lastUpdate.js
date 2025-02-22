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

async function fetchCardDataLastUpdated() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/artifacts/data-last-update');
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const lastUpdated = await response.text(); // Assuming the file contains the last updated date as text
        const lastUpdatedDate = new Date(lastUpdated);
        const currentDate = new Date();

        // 计算差距（单位：天）
        const diffTime = Math.abs(currentDate - lastUpdatedDate) / 1000; // in milliseconds
        const diffDays = Math.floor((diffTime) / (1000 * 60 * 60 * 24)); // in days (floor because we don't want partial days)
        console.log(diffDays);

        // 显示最后更新时间及“X天前”
        document.getElementById("data-last-updated").textContent = `（卡牌数据最后更新：${diffDays}天前｜${lastUpdated}）`;
    } catch (error) {
        document.getElementById("data-last-updated").textContent = "（卡牌数据最后更新：获取失败）";
        console.error("获取卡牌数据最后更新时间失败:", error);
    }
}

// 调用示例
fetchCardDataLastUpdated();