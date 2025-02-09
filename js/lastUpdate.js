async function fetchLastUpdated(owner, repo) {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GitHub API 请求失败: ${response.status}`);

        const data = await response.json();
        const lastUpdated = new Date(data.pushed_at).toISOString().slice(0, 10); // 只保留 YYYY-MM-DD

        document.getElementById("last-updated").textContent = `※ 本站最后更新：${lastUpdated}`;
    } catch (error) {
        document.getElementById("last-updated").textContent = "※ 获取失败";
        console.error("获取 GitHub 仓库信息失败:", error);
    }
}

// 立即调用
fetchLastUpdated("a1sareru", "shoot300k");

async function fetchFolderLastUpdated(owner, repo, folderPath) {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(folderPath)}&per_page=1`;
    let dataUpdateTimeStr = "获取失败";
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GitHub API 请求失败: ${response.status}`);

        const data = await response.json();
        if (data.length === 0) throw new Error("没有找到相关提交记录");

        const lastUpdated = new Date(data[0].commit.committer.date).toISOString().slice(0, 10); // YYYY-MM-DD
        dataUpdateTimeStr = lastUpdated;
    } catch (error) {
        console.error("获取文件夹的 GitHub 提交时间失败:", error);
    }
    document.getElementById("data-last-updated").textContent = "（卡牌数据最后更新：" + dataUpdateTimeStr + "）";
    
}

// 调用示例，获取 `solutions/` 文件夹的最后更新时间
fetchFolderLastUpdated("a1sareru", "shoot300k", "public/data");