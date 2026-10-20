/**
 * Kantin KDMP Sinduadi - Modul PWA & Layanan Offline
 * Menangani instalasi Progressive Web App, deteksi iOS, dan Service Worker
 */

(function () {
  'use strict';

  // Registrasi Service Worker untuk cache offline penuh
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          console.log('[PWA] ServiceWorker terdaftar dengan scope:', reg.scope);
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] ServiceWorker versi baru siap.');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] ServiceWorker gagal terdaftar:', err);
        });
    });
  }

  // Tangkap event sebelum instalasi Chrome / Android
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    if (window.state) {
      window.state.deferredPrompt = e;
    }
    if (typeof window.renderApp === 'function') {
      window.renderApp();
    }
  });

  // Tangkap event setelah aplikasi berhasil di-install
  window.addEventListener('appinstalled', () => {
    if (window.state) {
      window.state.isInstalled = true;
      window.state.deferredPrompt = null;
    }
    if (typeof window.renderApp === 'function') {
      window.renderApp();
    }
  });

  // Deteksi mode standalone & perangkat iOS (Safari)
  if (typeof window !== 'undefined') {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (window.state && isStandalone) {
      window.state.isInstalled = true;
    }
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (window.state) {
      window.state.isIOS = /iphone|ipad|ipod/.test(userAgent);
    }
  }

  async function triggerInstallPWA() {
    if (!window.state) return;

    if (window.state.deferredPrompt) {
      window.state.deferredPrompt.prompt();
      const choice = await window.state.deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        window.state.isInstalled = true;
      }
      window.state.deferredPrompt = null;
      if (typeof window.renderApp === 'function') {
        window.renderApp();
      }
    } else if (window.state.isIOS) {
      window.state.showIOSPrompt = !window.state.showIOSPrompt;
      if (typeof window.renderApp === 'function') {
        window.renderApp();
      }
    }
  }

  // Export ke global
  window.KDMPPWA = {
    triggerInstallPWA
  };
  window.triggerInstallPWA = triggerInstallPWA;
})();
