let isFilteringSSR = false; // 是否处于 SSR 过滤模式

// 更新已选卡片 ID 的显示
function updateSelectedIdsDisplay() {
  const selectedCards = document.querySelectorAll(".card.selected");
  const selectedIds = Array.from(selectedCards).map(card => {
    const id = parseInt(card.dataset.id, 10);
    return id >= 337 ? id - 19 : id;
  });
  document.getElementById("selected-ids").innerHTML = selectedIds.join(",");
}

// 渲染卡牌列表
function renderCards(cards, selectedIds = new Set()) {
  const cardListEl = document.getElementById("card-list");
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

      if (selectedIds.has(card.id)) {
        cardEl.classList.add("selected");
      }

      cardEl.innerHTML = `
        <figure>
          <img src="public/images/card_icons/Card_icon_${card.id >= 337 ? card.id - 19 : card.id}.png"
              alt="${card.title}" onerror="this.src=''">
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
  document.getElementById("toggle-sr").addEventListener("click", toggleAllSR);
  document.getElementById("filter-ssr").addEventListener("click", filterSSR);
  document.getElementById("clear-selection").addEventListener("click", clearAllSelectedCards);
  document.getElementById("copy-result").addEventListener("click", copySelectedIds);
}

function toggleAllSR() {
  const toggleButton = document.getElementById("toggle-sr");
  if (isFilteringSSR) {
    isFilteringSSR = false;
    document.getElementById("filter-ssr").textContent = getI18n("btn.only-show-ssr");
    loadCards(() => toggleAllSR());
    return;
  }
  const srCards = document.querySelectorAll(".card.silver-border");
  const allSelected = Array.from(srCards).every(card => card.classList.contains("selected"));
  srCards.forEach(card => card.classList.toggle("selected", !allSelected));
  toggleButton.textContent = getI18n(allSelected ? "btn.select-all-sr" : "btn.remove-all-sr");
  updateSelectedIdsDisplay();
}

function restoreSelectedCards(selectedIds) {
  document.querySelectorAll(".card").forEach(card => {
    if (selectedIds.has(card.dataset.id)) {
      card.classList.add("selected");
    }
  });
  updateSelectedIdsDisplay();
}

function filterSSR() {
  const toggleSRButton = document.getElementById("toggle-sr");
  const selectedIds = new Set(
    Array.from(document.querySelectorAll(".card.selected")).map(card => card.dataset.id)
  );

  if (isFilteringSSR) {
    isFilteringSSR = false;
    document.getElementById("filter-ssr").textContent = getI18n("btn.only-show-ssr");
    toggleSRButton.textContent = getI18n("btn.select-all-sr");
    loadCards().then(() => restoreSelectedCards(selectedIds));
  } else {
    fetch("public/data/character_card.csv")
      .then(res => res.text())
      .then(csv => {
        const cards = parseCSV(csv);
        const ssrCards = cards.filter(card => card.rarity.trim() === "4");
        renderCards(ssrCards);
        isFilteringSSR = true;
        document.getElementById("filter-ssr").textContent = getI18n("btn.show-all");
        toggleSRButton.textContent = getI18n("btn.sr-disabled");
        restoreSelectedCards(selectedIds);
      })
      .catch(err => console.error("加载卡牌数据失败:", err));
  }
}

function clearAllSelectedCards() {
  document.querySelectorAll(".card.selected").forEach(card => {
    card.classList.remove("selected");
  });
  updateSelectedIdsDisplay();
}

function copySelectedIds() {
  const text = document.getElementById("selected-ids").innerText;
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
}