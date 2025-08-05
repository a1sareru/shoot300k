async function loadLanguage(lang) {
  try {
    const res = await fetch(`lang/${lang}.json`);
    if (!res.ok) throw new Error("语言包加载失败");

    const dict = await res.json();

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const value = dict[key];
      if (!value) return;

      if ("placeholder" in el) {
        el.placeholder = value;
      } else {
        el.innerHTML = value;
      }
    });
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