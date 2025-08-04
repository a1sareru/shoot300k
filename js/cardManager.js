let isFilteringSSR = false; // 标记是否处于 SSR 过滤模式

// 更新已选卡片 ID 的显示
function updateSelectedIdsDisplay() {
    const selectedCards = document.querySelectorAll(".card.selected");
    const selectedIds = Array.from(selectedCards).map(card => card.dataset.id);

    const selectedIdsEl = document.getElementById("selected-ids");
    selectedIdsEl.innerHTML = `${selectedIds.join(",")}`;
}

// 渲染卡牌列表到页面
function renderCards(cards, selectedIds = new Set()) {
    const cardListEl = document.getElementById('card-list');
    if (cards.length === 0) {
        cardListEl.innerText = '没有找到符合条件的卡牌。';
        return;
    }
    cardListEl.innerHTML = '';
    cards
        .slice() // 可选：防止修改原数组
        .sort((a, b) => b.id - a.id) // 按 id 降序排序
        .forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.dataset.id = card.id;

            if (card.rarity.trim() === "4") {
                cardEl.classList.add('gold-border');
            } else if (card.rarity.trim() === "3") {
                cardEl.classList.add('silver-border');
            }

            if (selectedIds.has(card.id)) {
                cardEl.classList.add("selected");
            }

            cardEl.innerHTML = `
          <figure>
            <img src="public/images/card_icons/Card_icon_${card.id >= 337 ? card.id - 19 : card.id}.png"
                alt="${card.title}"
                onerror="this.src='';" />
            <figcaption>
              ${formatCardCaption(card)}
            </figcaption>
          </figure>
        `;
            cardEl.addEventListener('click', () => {
                cardEl.classList.toggle('selected');
                updateSelectedIdsDisplay();
            });
            cardListEl.appendChild(cardEl);
        });
}

// 设置按钮功能
function setupButtons() {
    document.getElementById("toggle-sr").addEventListener("click", toggleAllSR);
    document.getElementById("filter-ssr").addEventListener("click", filterSSR);
    document.getElementById("clear-selection").addEventListener("click", clearAllSelectedCards); // 绑定清除按钮
}

// 切换所有 SR 卡片的选中状态
function toggleAllSR() {
    const toggleButton = document.getElementById("toggle-sr");

    // 如果当前处于 SSR 过滤模式，先恢复所有卡片
    if (isFilteringSSR) {
        isFilteringSSR = false;
        document.getElementById("filter-ssr").textContent = "只显示SSR";
        loadCards(() => {
            toggleAllSR(); // 重新调用自身，确保 SR 选中操作执行
        });
        return;
    }

    const srCards = document.querySelectorAll(".card.silver-border"); // 选择所有 SR 卡片
    const allSelected = Array.from(srCards).every(card => card.classList.contains("selected"));

    srCards.forEach(card => {
        if (allSelected) {
            card.classList.remove("selected"); // 取消选择
        } else {
            card.classList.add("selected"); // 选择
        }
    });

    // 根据状态切换按钮文本
    toggleButton.textContent = allSelected ? "选中全部SR" : "去除全部SR";
    updateSelectedIdsDisplay();
}

function restoreSelectedCards(selectedIds) {
    document.querySelectorAll(".card").forEach(card => {
        if (selectedIds.has(card.dataset.id)) {
            card.classList.add("selected"); // ✅ 重新标记选中
        }
    });
    updateSelectedIdsDisplay();
}

function filterSSR() {
    const cardListEl = document.getElementById('card-list');
    const toggleSRButton = document.getElementById("toggle-sr");

    // 记录所有已选中的卡片ID
    const selectedIds = new Set(
        Array.from(document.querySelectorAll(".card.selected")).map(card => card.dataset.id)
    );

    if (isFilteringSSR) {
        // 退出 SSR 过滤模式，恢复所有卡牌，并恢复选中状态
        isFilteringSSR = false;
        document.getElementById("filter-ssr").textContent = "只显示SSR";
        toggleSRButton.textContent = "选中全部SR";

        // ✅ 这里要传 selectedIds
        loadCards().then(() => {
            restoreSelectedCards(selectedIds); // 重新渲染后恢复选中状态
        });
    } else {
        // 进入 SSR 过滤模式
        fetch('public/data/character_card.csv')
            .then(response => response.text())
            .then(csvText => {
                const cards = parseCSV(csvText);
                const ssrCards = cards.filter(card => card.rarity.trim() === "4");

                renderCards(ssrCards); // 只渲染 SSR
                isFilteringSSR = true;
                document.getElementById("filter-ssr").textContent = "显示所有卡牌";
                toggleSRButton.textContent = "SR不在服务区";

                // ✅ 重新恢复 SSR 选中的状态
                restoreSelectedCards(selectedIds);
            })
            .catch(error => console.error("加载卡牌数据失败:", error));
    }
}

// 清除所有已选卡片的选中状态
function clearAllSelectedCards() {
    document.querySelectorAll(".card.selected").forEach(card => {
        card.classList.remove("selected");
    });

    updateSelectedIdsDisplay();
}

// 复制当前框内结果
document.getElementById('copy-result').addEventListener('click', () => {
    const text = document.getElementById('selected-ids').innerText;
    const ids = text.match(/\d+(,\s*\d+)*/); // 提取数字 ID 串

    if (!ids) {
        alert('没有选中的卡牌');
        return;
    }

    navigator.clipboard.writeText(ids[0])
        .then(() => {
            alert('结果已复制到剪贴板');
        })
        .catch(err => {
            alert('复制失败，请手动复制');
            console.error(err);
        });
});