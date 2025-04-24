function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
}

// Apply system preference before DOMContentLoaded to avoid FOUC
(function () {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
})();

document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggle-theme');

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
  }

  toggleButton.addEventListener('click', toggleTheme);
});