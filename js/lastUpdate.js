async function fetchLastUpdated(owner, repo) {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GitHub API 请求失败: ${response.status}`);

        const data = await response.json();
        const lastUpdated = new Date(data.pushed_at).toLocaleString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        document.getElementById("last-updated").textContent = `最后更新: ${lastUpdated}`;
    } catch (error) {
        document.getElementById("last-updated").textContent = "获取失败";
        console.error("获取 GitHub 仓库信息失败:", error);
    }
}

// 立即调用
fetchLastUpdated("a1sareru", "shoot300k");