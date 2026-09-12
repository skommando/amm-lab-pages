// 在样式和正文绘制前恢复用户选择；存储不可用时安全回到浅色。
(function () {
  var theme = 'light';
  try { if (localStorage.getItem('amm_lab_theme') === 'dark') theme = 'dark'; } catch (_) {}
  document.documentElement.dataset.siteTheme = theme;
})();
