let isFilteringSSR = false; // 标记是否处于 SSR 过滤模式


// 加载 CSV 数据并显示持有卡牌
function loadCards() {
    fetch('https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/data/character_card.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载CSV文件');
            }
            return response.text();
        })
        .then(csvText => {
            const cards = parseCSV(csvText);
            // 过滤只显示 SSR 和 SR（rarity 为 4 或 3）
            const filteredCards = cards.filter(card => {
                const rarity = card.rarity.trim();
                return rarity === "4" || rarity === "3";
            });
            renderCards(filteredCards);
        })
        .catch(error => {
            document.getElementById('card-list').innerText = '加载卡牌数据出错: ' + error;
            console.error(error);
        });
    setupButtons();

}


// 解析 CSV 文件
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header.trim()] = values[index] ? values[index].trim() : "";
        });
        return obj;
    });
    return data;
}


// 渲染卡牌列表到页面
function renderCards(cards, selectedIds = new Set()) {
    const cardListEl = document.getElementById('card-list');
    if (cards.length === 0) {
        cardListEl.innerText = '没有找到符合条件的卡牌。';
        return;
    }
    cardListEl.innerHTML = '';
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.id = card.id;

        if (card.rarity.trim() === "4") {
            cardEl.classList.add('gold-border');
        } else if (card.rarity.trim() === "3") {
            cardEl.classList.add('silver-border');
        }

        // 还原选中状态
        if (selectedIds.has(card.id)) {
            cardEl.classList.add("selected");
        }

        // 设置卡牌内容（图片和标题）
        cardEl.innerHTML = `
            <figure style="display: flex; flex-direction: column; align-items: center; margin: 0;">
              <img src="https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/images/cards/${card.id}.jpg" 
                  alt="${card.title}" 
                  style="width: 34px; height: 60px;" 
                  onerror="this.src='';" />
              <figcaption style="font-size: 9px; text-align: center; white-space: normal; word-break: break-word; line-height: 1.7; margin: 2px 0; padding: 2px;">
                ${(() => {
                const modified = card.title.replace(/【/g, '').replace(/】/g, '<br>') + " | " + card.id;
                const lines = modified.split('<br>');
                if (lines.length > 0) {
                    lines[0] = `<strong style="font-size: 10.5px; font-weight: 900; color: #000; -webkit-text-stroke: 0.3px #a7d8e8;">${lines[0]}</strong>`;
                }
                return lines.join('<br>');
            })()}
              </figcaption>
            </figure>
          `;
        cardEl.addEventListener('click', () => {
            cardEl.classList.toggle('selected');
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
}

function filterSSR() {
    const cardListEl = document.getElementById('card-list');

    if (isFilteringSSR) {
        // 退出 SSR 过滤模式，恢复所有卡牌
        isFilteringSSR = false;
        document.getElementById("filter-ssr").textContent = "只显示SSR";
        loadCards(() => {
            restoreSelectedCards(); // 重新渲染后恢复选中状态
        });
    } else {
        // 进入 SSR 过滤模式，记录当前选中的卡牌
        const selectedIds = new Set(
            Array.from(document.querySelectorAll(".card.selected")).map(card => card.dataset.id)
        );

        fetch('https://raw.githubusercontent.com/a1sareru/shoot300k/refs/heads/main/public/data/character_card.csv')
            .then(response => response.text())
            .then(csvText => {
                const cards = parseCSV(csvText);
                const ssrCards = cards.filter(card => card.rarity.trim() === "4");

                renderCards(ssrCards, selectedIds); // 传入已选中的 ID，确保选中状态不丢失
                isFilteringSSR = true;
                document.getElementById("filter-ssr").textContent = "显示所有卡牌";
            })
            .catch(error => console.error("加载卡牌数据失败:", error));
    }
}


// 清除所有已选卡片的选中状态
function clearAllSelectedCards() {
    document.querySelectorAll(".card.selected").forEach(card => {
        card.classList.remove("selected");
    });

    document.getElementById("selected-ids").innerHTML = ""; // 清空已选 ID 显示
}