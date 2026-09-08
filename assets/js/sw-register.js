if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // 毎回無条件で Service Worker の再インストール/更新を実行
        console.log('[PWA] Executing mandatory SW re-installation...');
        registration.update();
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}
