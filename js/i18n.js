let currentLangDict = {};

let supportedLangs = ["zh", "ja", "en", "kr"];

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
      let params = {};

      // 优先使用 dataset 中的缓存参数（语言切换时也能保留）
      if (el.dataset.i18nParamsCache) {
        try {
          params = JSON.parse(el.dataset.i18nParamsCache);
        } catch {
          params = {};
        }
      }
      // 如果初始渲染，还没有缓存
      else if (el.getAttribute("data-i18n-params")) {
        try {
          params = JSON.parse(el.getAttribute("data-i18n-params"));
          el.dataset.i18nParamsCache = JSON.stringify(params);  // 缓存起来
        } catch {
          params = {};
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

    // 更新动态生成的文字（按钮等）
    if (typeof updateDynamicText === 'function') {
      updateDynamicText();
    }
  } catch (e) {
    console.error(e);
  }
}

function highlightActiveLang(lang) {
  document.querySelectorAll(".lang-text").forEach(el => {
    el.classList.toggle("active", el.getAttribute("data-lang") === lang);
  });
}

function detectBrowserLang(supported = supportedLangs, fallback = "zh") {
  const lang = (navigator.language || "").toLowerCase();
  for (const code of supported) {
    if (lang.startsWith(code)) return code;
  }
  return fallback;
}

document.addEventListener("DOMContentLoaded", () => {
  const stored = localStorage.getItem("lang");
  const lang = stored || detectBrowserLang(supportedLangs, "zh");

  loadLanguage(lang).then(() => {
    fetchRepoLastUpdated();
    fetchCardDataLastUpdated();
  });

  highlightActiveLang(lang);

  document.querySelectorAll(".lang-text").forEach(span => {
    span.addEventListener("click", () => {
      const selectedLang = span.getAttribute("data-lang");
      localStorage.setItem("lang", selectedLang);
      loadLanguage(selectedLang).then(() => {
        fetchRepoLastUpdated();
        fetchCardDataLastUpdated();
      });
      highlightActiveLang(selectedLang);
    });
  });
});