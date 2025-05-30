document.addEventListener("DOMContentLoaded", function() {
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {
        item.addEventListener("click", function() {
            if (this.id === "toggle-theme") return; // 👈 跳过主题按钮

            // 取消所有导航项的 active 状态
            navItems.forEach(nav => nav.classList.remove("active"));

            // 给当前点击的导航项添加 active
            this.classList.add("active");

            // 获取对应的 tab-content ID
            const targetId = this.getAttribute("data-target");
            localStorage.setItem("activeTab", targetId);

            // 隐藏所有 tab-content
            document.querySelectorAll(".tab-content").forEach(tab => {
                tab.classList.remove("active");
            });

            // 显示对应的 tab-content
            document.getElementById(targetId).classList.add("active");

            // 进入 "持有卡牌" 页面时，加载卡牌
            if (targetId === "selectCards") {
                document.body.style.overflow = "hidden";
                loadCards();
            } else {
                document.body.style.overflow = "auto";
            }
        });
    });

    const savedTab = localStorage.getItem("activeTab") || "topPage";

    // 激活对应 tab-content 和 nav-item
    const savedNav = document.querySelector(`.nav-item[data-target='${savedTab}']`);
    const savedContent = document.getElementById(savedTab);

    // fallback 逻辑
    if (savedNav && savedContent) {
        savedNav.classList.add("active");
        savedContent.classList.add("active");
    } else {
        document.querySelector(".nav-item[data-target='topPage']").classList.add("active");
        document.querySelector("#topPage").classList.add("active");
    }
    if (savedTab === "selectCards") {
        document.body.style.overflow = "hidden";
        loadCards();
    } else {
        document.body.style.overflow = "auto";
    }
});