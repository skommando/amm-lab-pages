/* 官网与独立工具共用：主题只修改文档配色，不重载 iframe 或表单。 */
(function () {
  if (typeof window === 'undefined' || window.AMMTheme) return;
  var key = 'amm_lab_theme';
  var origin = window.location.origin;
  var embedded = window.parent !== window;
  var current = readSaved('light');
  function valid(value) { return value === 'light' || value === 'dark'; }
  function readSaved(fallback) {
    try { return window.localStorage.getItem(key) === 'dark' ? 'dark' : 'light'; }
    catch (_) { return fallback; }
  }
  function frames() {
    return Array.from(document.querySelectorAll('iframe[data-amm-theme-frame]')).filter(function (frame) {
      try { return new URL(frame.src, window.location.href).origin === origin; }
      catch (_) { return false; }
    });
  }
  function send(target, type, theme) {
    if (!target || origin === 'null') return;
    target.postMessage({ type: type, theme: theme }, origin);
  }
  function paintButtons() {
    document.querySelectorAll('[data-tool-theme-toggle]').forEach(function (button) {
      var label = current === 'dark' ? '切换到亮色模式' : '切换到暗色模式';
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(current === 'dark'));
      button.title = label;
      button.innerHTML = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        (current === 'dark' ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>' : '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>') + '</svg>';
    });
  }
  function apply(theme, persist, notifyParent) {
    if (!valid(theme)) return;
    var changed = theme !== current;
    current = theme;
    if (persist) { try { window.localStorage.setItem(key, theme); } catch (_) {} }
    document.documentElement.dataset.siteTheme = theme;
    paintButtons();
    if (!changed) return;
    window.dispatchEvent(new CustomEvent('amm-theme-change', { detail: { theme: theme } }));
    frames().forEach(function (frame) { send(frame.contentWindow, 'amm-theme-sync', theme); });
    if (embedded && notifyParent) send(window.parent, 'amm-theme-set', theme);
  }
  window.AMMTheme = {
    get: function () { return current; },
    set: function (theme) { apply(theme, true, true); }
  };
  if (embedded) document.documentElement.dataset.toolEmbedded = '';
  document.documentElement.dataset.siteTheme = current;
  window.addEventListener('storage', function (event) {
    if (event.key !== key && event.key !== null) return;
    try { if (event.storageArea && event.storageArea !== window.localStorage) return; } catch (_) { return; }
    apply(readSaved(current), false, false);
  });
  window.addEventListener('message', function (event) {
    if (origin === 'null' || event.origin !== origin || !event.data) return;
    if (embedded && event.source === window.parent) {
      if (event.data.type === 'amm-theme-sync') apply(event.data.theme, false, false);
      return;
    }
    var frame = frames().find(function (item) { return item.contentWindow === event.source; });
    if (!frame) return;
    if (event.data.type === 'amm-theme-ready') send(event.source, 'amm-theme-sync', current);
    if (event.data.type === 'amm-theme-set') apply(event.data.theme, true, false);
  });
  function ready() {
    paintButtons();
    document.querySelectorAll('[data-tool-theme-toggle]').forEach(function (button) {
      button.addEventListener('click', function () { window.AMMTheme.set(current === 'dark' ? 'light' : 'dark'); });
    });
    if (embedded) send(window.parent, 'amm-theme-ready', current);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
