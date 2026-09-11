(() => {
  document.documentElement.classList.add('amm-embedded-product');

  const notifyHost = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'amm-product-ready',
          path: window.location.pathname,
          title: document.title,
        },
        '*',
      );
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', notifyHost, { once: true });
  } else {
    notifyHost();
  }
})();
