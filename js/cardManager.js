let isFilteringSSR = false; // 是否处于 SSR 过滤模式

// 获取当前文本框中的 ID 列表（返回显示 ID 的 Set）
function getSelectedIdsFromUI() {
    const inputEl = document.getElementById("selected-ids");
    if (!inputEl) return new Set();
    return new Set(inputEl.value.split(",")
        .map(s => s.trim())
        .filter(s => s !== ""));
}

// 将 ID 列表回写到文本框（不保存到本地存储）
function setSelectedIdsToUI(idSet) {
    const idArray = Array.from(idSet);
    idArray.sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (isNaN(numA) || isNaN(numB)) return 0;
        return numB - numA;
    });
    const idString = idArray.join(",");
    const inputEl = document.getElementById("selected-ids");
    if (inputEl) {
        if (inputEl.tagName === 'TEXTAREA') {
            inputEl.value = idString;
        }
        inputEl.innerHTML = idString;
    }
    
    // 同步更新页面上可见卡牌的选中样式
    syncCardClasses(idSet);
}

// 根据 ID 集合同步页面卡牌的选中样式
function syncCardClasses(displayIdSet) {
    document.querySelectorAll(".card").forEach(cardEl => {
        const internalId = parseInt(cardEl.dataset.id, 10);
        const displayId = String(internalId >= 337 ? internalId - 19 : internalId);
        if (displayIdSet.has(displayId)) {
            cardEl.classList.add("selected");
        } else {
            cardEl.classList.remove("selected");
        }
    });
}

// 更新已选卡片 ID 的显示（由单卡点击触发）
function updateSelectedIdsDisplay() {
    const currentDisplaySet = getSelectedIdsFromUI();
    
    // 获取当前页面上所有可见且【未选中】的卡牌 ID
    const unselectedInDom = new Set();
    document.querySelectorAll(".card:not(.selected)").forEach(el => {
        const id = parseInt(el.dataset.id, 10);
        unselectedInDom.add(String(id >= 337 ? id - 19 : id));
    });

    // 获取当前页面上所有可见且【选中】的卡牌 ID
    const selectedInDom = new Set();
    document.querySelectorAll(".card.selected").forEach(el => {
        const id = parseInt(el.dataset.id, 10);
        selectedInDom.add(String(id >= 337 ? id - 19 : id));
    });

    const nextSet = new Set();
    selectedInDom.forEach(id => nextSet.add(id));
    
    currentDisplaySet.forEach(id => {
        if (!unselectedInDom.has(id)) {
            nextSet.add(id);
        }
    });

    setSelectedIdsToUI(nextSet);
}

// 应用手动输入的 ID 列表（导入功能）
function applySelection() {
  const inputEl = document.getElementById("selected-ids");
  const errorEl = document.getElementById("card-manager-error");
  if (!inputEl) return;

  const inputText = inputEl.value.trim().replace(/\s+/g, '');

  if (inputText === "") {
    clearAllSelectedCards();
    if (errorEl) errorEl.style.display = "none";
    return;
  }

  // 检查格式是否正确
  if (!/^\d+(,\d+)*$/.test(inputText)) {
    if (errorEl) {
      errorEl.textContent = getI18n("calc.error.invalid-input");
      errorEl.style.display = "block";
    }
    return;
  }
  if (errorEl) errorEl.style.display = "none";

  const displayIds = inputText.split(",").map(s => s.trim());
  setSelectedIdsToUI(new Set(displayIds));
}

// 渲染卡牌列表
function renderCards(cards, selectedIds = new Set()) {
  const cardListEl = document.getElementById("card-list");
  if (!cardListEl) return;

  if (cards.length === 0) {
    cardListEl.innerText = getI18n("cardmanager.load-failure") || "卡牌加载失败。";
    return;
  }
  cardListEl.innerHTML = "";
  cards
    .slice()
    .sort((a, b) => b.id - a.id)
    .forEach(card => {
      const cardEl = document.createElement("div");
      cardEl.className = "card";
      cardEl.dataset.id = card.id;

      if (card.rarity.trim() === "4") {
        cardEl.classList.add("gold-border");
      } else if (card.rarity.trim() === "3") {
        cardEl.classList.add("silver-border");
      }

      const displayId = String(card.id >= 337 ? card.id - 19 : card.id);
      if (selectedIds.has(displayId)) {
        cardEl.classList.add("selected");
      }

      cardEl.innerHTML = `
        <figure>
          <img src="public/images/card_icons/Card_icon_${displayId}.png"
              alt="${card.title}" onerror="this.onerror=null; this.src='public/images/miscs/placeholder.png';">
          <figcaption>${formatCardCaption(card)}</figcaption>
        </figure>
      `;
      cardEl.addEventListener("click", () => {
        cardEl.classList.toggle("selected");
        updateSelectedIdsDisplay();
      });
      cardListEl.appendChild(cardEl);
    });
}

// 设置按钮绑定
function setupButtons() {
  const safeAddListener = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  };
  safeAddListener("toggle-sr", "click", toggleAllSR);
  safeAddListener("filter-ssr", "click", filterSSR);
  safeAddListener("clear-selection", "click", clearAllSelectedCards);
  safeAddListener("copy-result", "click", copySelectedIds);
  safeAddListener("apply-selection", "click", applySelection);
}

function toggleAllSR() {
  const toggleButton = document.getElementById("toggle-sr");
  if (!toggleButton) return;

  if (isFilteringSSR) {
    isFilteringSSR = false;
    toggleButton.textContent = getI18n("btn.only-show-ssr");
    loadCards(() => toggleAllSR());
    return;
  }
  
  fetchAndParseCards().then(allCards => {
      const allSrDisplayIds = allCards
        .filter(c => c.rarity.trim() === "3")
        .map(c => String(c.id >= 337 ? c.id - 19 : c.id));

      const currentSet = getSelectedIdsFromUI();
      const isAllSrSelected = allSrDisplayIds.every(id => currentSet.has(id));

      if (isAllSrSelected) {
        allSrDisplayIds.forEach(id => currentSet.delete(id));
      } else {
        allSrDisplayIds.forEach(id => currentSet.add(id));
      }

      setSelectedIdsToUI(currentSet);
      toggleButton.textContent = getI18n(isAllSrSelected ? "btn.select-all-sr" : "btn.remove-all-sr");
  });
}

function restoreSelectedCards(selectedIds) {
  syncCardClasses(selectedIds);
  updateSelectedIdsDisplay();
}

function filterSSR() {
  const toggleSRButton = document.getElementById("toggle-sr");
  const selectedIds = getSelectedIdsFromUI();

  if (isFilteringSSR) {
    isFilteringSSR = false;
    const filterBtn = document.getElementById("filter-ssr");
    if (filterBtn) filterBtn.textContent = getI18n("btn.only-show-ssr");
    if (toggleSRButton) toggleSRButton.textContent = getI18n("btn.select-all-sr");
    loadCards().then(() => restoreSelectedCards(selectedIds));
  } else {
    fetch("public/data/character_card.csv")
      .then(res => res.text())
      .then(csv => {
        const cards = parseCSV(csv);
        const ssrCards = cards.filter(card => card.rarity.trim() === "4");
        renderCards(ssrCards, selectedIds);
        isFilteringSSR = true;
        const filterBtn = document.getElementById("filter-ssr");
        if (filterBtn) filterBtn.textContent = getI18n("btn.show-all");
        if (toggleSRButton) toggleSRButton.textContent = getI18n("btn.sr-disabled");
      })
      .catch(err => console.error("加载卡牌数据失败:", err));
  }
}

function clearAllSelectedCards() {
  setSelectedIdsToUI(new Set());
}

function copySelectedIds() {
  const inputEl = document.getElementById("selected-ids");
  const text = inputEl ? inputEl.value : "";
  const ids = text.match(/\d+(,\s*\d+)*/);
  if (!ids) {
    alert(getI18n("alert.no-selection") || "No cards selected.");
    return;
  }
  navigator.clipboard.writeText(ids[0])
    .then(() => alert(getI18n("alert.copy-success") || "结果已复制到剪贴板"))
    .catch(err => {
      alert(getI18n("alert.copy-fail") || "复制失败，请手动复制");
      console.error(err);
    });
}

// 在 i18n.js 中暴露此函数供 loadLanguage 调用
function updateDynamicText() {
  const setText = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = getI18n(key);
  };
  setText("clear-selection", "btn.clear");
  setText("toggle-sr", isFilteringSSR ? "btn.sr-disabled" : "btn.select-all-sr");
  setText("filter-ssr", isFilteringSSR ? "btn.show-all" : "btn.only-show-ssr");
  setText("copy-result", "btn.copy");
  setText("apply-selection", "btn.import");
}
