let currentLangDict = {};

function getI18n(key, params = {}, fallback = '') {
  const template = currentLangDict[key] || fallback;
  return template.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
}

async function loadLanguage(lang) {
  try {
    const res = await fetch(`lang/${lang}.json`);
    if (!res.ok) throw new Error("语言包加载失败");

    const dict = await res.json();
    currentLangDict = dict;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const paramsAttr = el.getAttribute("data-i18n-params");
      let params = {};

      if (paramsAttr) {
        try {
          params = JSON.parse(paramsAttr);
        } catch (e) {
          console.warn("无效的 data-i18n-params:", paramsAttr);
        }
      }

      const value = getI18n(key, params);
      if (!value) return;

      if ("placeholder" in el) {
        el.placeholder = value;
      } else {
        el.innerHTML = value;
      }
    });

    // 更新动态按钮等文字
    if (typeof updateDynamicText === 'function') {
      updateDynamicText();
    }
  } catch (e) {
    console.error(e);
  }
}

function highlightActiveLang(lang) {
  document.querySelectorAll(".lang-text").forEach(el => {
    if (el.getAttribute("data-lang") === lang) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });
}

function detectBrowserLang(supported = ["zh", "ja"], fallback = "zh") {
  const lang = (navigator.language || "").toLowerCase();
  for (const code of supported) {
    if (lang.startsWith(code)) return code;
  }
  return fallback;
}

document.addEventListener("DOMContentLoaded", () => {
  // 如果 localStorage 有记录就用它；否则根据浏览器语言判断
  const stored = localStorage.getItem("lang");
  const lang = stored || detectBrowserLang(["zh", "ja"], "zh");

  loadLanguage(lang);
  highlightActiveLang(lang);

  document.querySelectorAll(".lang-text").forEach(span => {
    span.addEventListener("click", () => {
      const selectedLang = span.getAttribute("data-lang");
      localStorage.setItem("lang", selectedLang);
      loadLanguage(selectedLang);
      highlightActiveLang(selectedLang);
    });
  });
});