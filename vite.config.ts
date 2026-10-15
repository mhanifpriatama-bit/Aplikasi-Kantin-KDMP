import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa'; // 1. Impor plugin PWA

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({ // 2. Tambahkan Konfigurasi PWA Otomatis
        registerType: 'autoUpdate',
        injectRegister: 'script',
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'], // Caching file agar bisa diakses Offline
        },
        manifest: {
          name: 'Kantin KDMP Sinduadi',
          short_name: 'Kantin KDMP',
          description: 'Sistem kasir kantin kejujuran dan titipan produk KDMP Sinduadi.',
          theme_color: '#2563eb', // Warna tema (Biru)
          background_color: '#ffffff',
          display: 'standalone', // Membuka aplikasi tanpa bar navigasi browser
          start_url: '/',
          scope: '/',
             icons: [
          {
            src: '/icon-192.png', // Sesuaikan dengan nama file yang Anda upload
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png', // Sesuaikan dengan nama file yang Anda upload
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
