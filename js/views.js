/**
 * Kantin KDMP Sinduadi - Modul Tampilan Antarmuka (Views / UI Templates)
 * Menghasilkan komponen HTML yang terstruktur, bersih, dan modular
 */

(function () {
  'use strict';

  function renderHeader(state) {
    return `
      <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div class="max-w-4xl mx-auto px-4 py-2.5 flex justify-between items-center gap-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl shadow-xs bg-white flex items-center justify-center p-0.5 flex-shrink-0 border border-slate-200 overflow-hidden">
              <img src="./ikonmaskabel.svg" alt="Logo Kantin KDMP" class="w-full h-full object-contain" />
            </div>
            <div>
              <h1 class="font-bold text-base text-slate-900 tracking-tight leading-none">
                KANTIN KDMP SINDUADI
              </h1>
              <span class="text-[11px] text-slate-500 font-medium">
                Sistem Kasir v.01 • 100% Offline
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- PWA INSTALL BUTTON -->
            ${
              !state.isInstalled && (state.deferredPrompt || state.isIOS)
                ? `
              <div class="relative">
                <button id="btn-pwa-install" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Install App</span>
                </button>
                ${
                  state.showIOSPrompt
                    ? `
                  <div class="absolute right-0 mt-2 w-64 p-3 bg-white border border-slate-200 shadow-xl rounded-xl text-xs text-slate-700 z-50">
                    <div class="flex justify-between items-center mb-1">
                      <strong class="text-slate-900">Pasang di iPhone / iPad</strong>
                      <button id="close-ios-prompt" class="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                    </div>
                    <p class="leading-relaxed">Ketuk ikon <strong>Bagikan (Share)</strong> di Safari, lalu pilih <strong>&quot;Tambah ke Layar Utama&quot;</strong>.</p>
                  </div>
                `
                    : ''
                }
              </div>
            `
                : ''
            }

            ${
              state.petugas
                ? `
              <div class="flex items-center gap-2 text-xs">
                <div class="flex flex-col text-right">
                  <strong class="text-slate-800">${state.petugas.nama}</strong>
                </div>
              </div>
            `
                : ''
            }
          </div>
        </div>
      </header>
    `;
  }

  function renderMainTable(state) {
    return `
      <main class="flex-1 max-w-4xl w-full mx-auto p-4 space-y-5">
        <div class="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 class="font-bold text-slate-900 text-sm">Daftar Produk Titipan</h3>
              <p class="text-xs text-slate-500">Stok barang yang tersedia di etalase</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              ${state.products.length} item terdaftar
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs">
                  <th class="p-3.5 font-semibold text-center w-24">Jumlah</th>
                  <th class="p-3.5 font-semibold">Produk</th>
                  <th class="p-3.5 font-semibold">Penitip</th>
                  <th class="p-3.5 font-semibold text-right">Harga Jual</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${
                  state.products.length > 0
                    ? state.products
                        .map(
                          (item, index) => `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="p-3.5 text-center">
                        <button data-edit-idx="${index}" title="Klik untuk ubah stok manual" class="btn-edit-qty inline-flex items-center gap-1 font-bold text-blue-600 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs transition cursor-pointer">
                          <span>${item.qty}</span>
                          <i data-lucide="edit-2" class="w-3 h-3 text-blue-400"></i>
                        </button>
                      </td>
                      <td class="p-3.5 text-slate-900 font-medium">${item.produk}</td>
                      <td class="p-3.5 text-slate-600">${item.penitip}</td>
                      <td class="p-3.5 text-slate-900 font-semibold text-right">
                        Rp ${Number(item.hargaJual).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  `
                        )
                        .join('')
                    : `
                    <tr>
                      <td colspan="4" class="p-10 text-center text-slate-400">
                        <div class="flex flex-col items-center justify-center space-y-2">
                          <i data-lucide="shopping-bag" class="w-8 h-8 text-slate-300"></i>
                          <p class="text-sm">Belum ada produk tersimpan.</p>
                          <p class="text-xs text-slate-400">
                            Buka tombol simulasi kamera di pojok kanan bawah untuk scan QR Produk.
                          </p>
                        </div>
                      </td>
                    </tr>
                  `
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>
    `;
  }

  function renderCheckDbModal() {
    return `
      <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-5 animate-zoomIn max-h-[85vh] overflow-y-auto mb-16 sm:mb-0">
          <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <i data-lucide="database" class="w-8 h-8"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-900">Database Ditemukan</h2>
            <p class="text-slate-600 text-sm mt-2 leading-relaxed">
              Terdapat data produk tersimpan sebelumnya di penyimpanan lokal. Apakah Anda ingin meneruskan data yang ada atau mereset database dari awal?
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3 pt-2">
            <button id="btn-db-continue" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-blue-200 cursor-pointer active:scale-95">
              Meneruskan
            </button>
            <button id="btn-db-reset" class="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-sm transition border border-rose-200 cursor-pointer active:scale-95">
              Reset dari Awal
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderWarningModal() {
    return `
      <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-5 animate-zoomIn max-h-[85vh] overflow-y-auto mb-16 sm:mb-0">
          <div class="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <i data-lucide="alert-triangle" class="w-8 h-8"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-900">Perhatian Sebelum Memulai</h2>
            <p class="text-slate-600 text-sm mt-2 leading-relaxed">
              Silakan cek kondisi baterai ponsel, persiapkan charger atau power bank, cek memori HP, sebelum melanjutkan. Aplikasi hanya bisa dilanjutkan dengan scan QR ID petugas.
            </p>
          </div>
          <div class="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs text-left leading-relaxed">
            💡 Gunakan tombol <strong>Simulasi QR</strong> di pojok kanan bawah atau tombol di bawah ini untuk scan QR ID Petugas.
          </div>

          <div class="space-y-2 pt-1">
            <button id="btn-quick-petugas" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-200 active:scale-98 cursor-pointer">
              <i data-lucide="check-circle-2" class="w-5 h-5"></i>
              Scan Cepat QR Petugas (Budi Santoso)
            </button>

            <button id="btn-open-petugas-sim" class="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 border border-blue-200 active:scale-98 cursor-pointer">
              <i data-lucide="qr-code" class="w-5 h-5 text-blue-600"></i>
              Buka Simulator Scanner QR Lengkap
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderKasAwalModal(state) {
    return `
      <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-zoomIn">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <i data-lucide="dollar-sign" class="w-6 h-6"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900">Pengisian Kas Awal</h2>
              <p class="text-slate-500 text-xs">Petugas: ${state.petugas ? state.petugas.nama : ''}</p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Kas Pagi (Uang Kembalian)
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
              <input
                type="number"
                id="input-kas-awal"
                value="${state.tempKasAwal}"
                placeholder="0"
                class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden text-lg font-bold text-slate-900"
              />
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Default: Rp 0 bila dikosongkan.</p>
          </div>

          <button id="btn-save-kas-awal" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-200 active:scale-98 cursor-pointer">
            <i data-lucide="check-circle-2" class="w-5 h-5"></i>
            Simpan Kas Awal (Scan QR "OK")
          </button>
          <div class="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs">
            💡 Atau gunakan tombol simulasi QR di pojok kanan bawah dan pilih <strong>"OK"</strong>.
          </div>
        </div>
      </div>
    `;
  }

  function renderTambahTitipanModal(state) {
    return `
      <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-zoomIn">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="shopping-bag" class="w-5 h-5 text-blue-600"></i>
              Tambah Titipan Produk Baru
            </h2>
          </div>

          <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-500">Produk:</span>
              <strong class="text-slate-800">${state.currentProduct.produk || ''}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Penitip:</span>
              <strong class="text-slate-800">${state.currentProduct.penitip || ''}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Harga Jual:</span>
              <strong class="text-slate-900">
                Rp ${Number(state.currentProduct.hargaJual || 0).toLocaleString('id-ID')}
              </strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Harga Titip (Dekripsi):</span>
              <strong class="text-emerald-600">
                Rp ${Number(state.currentProduct.hargaTitipDecrypted || 0).toLocaleString('id-ID')}
              </strong>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 text-center">
              Jumlah Stok Produk
            </label>
            <div class="text-4xl font-extrabold text-blue-600 text-center py-4 bg-blue-50 border border-blue-100 rounded-2xl">
              ${state.currentQty}
            </div>
          </div>

          <!-- Kontrol Cepat Qty Langsung di Pop-up -->
          <div class="flex items-center justify-center gap-2 pt-1">
            <button id="btn-titip-minus-5" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer" title="Kurang 5 (!)">
              -5 (!)
            </button>
            <button id="btn-titip-minus-1" class="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center transition active:scale-95 shadow-xs cursor-pointer" title="Kurang 1 (<)">
              <i data-lucide="minus" class="w-4 h-4"></i>
            </button>
            <button id="btn-titip-plus-1" class="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl text-sm font-bold flex items-center justify-center transition active:scale-95 shadow-xs cursor-pointer" title="Tambah 1 (>)">
              <i data-lucide="plus" class="w-4 h-4"></i>
            </button>
            <button id="btn-titip-plus-5" class="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer" title="Tambah 5 (^)">
              +5 (^)
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button id="btn-open-sim-from-titipan" class="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-blue-200 cursor-pointer">
              <i data-lucide="qr-code" class="w-4 h-4 text-blue-600"></i>
              <span>Scanner QR</span>
            </button>
            <button id="btn-titip-ok" class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95 cursor-pointer">
              <i data-lucide="check-circle-2" class="w-4 h-4"></i>
              <span>Simpan (OK)</span>
            </button>
          </div>

          <p class="text-[11px] text-slate-400 text-center">
            💡 Atau gunakan tombol QR biru di pojok kanan bawah atau tombol keyboard panah &amp; enter.
          </p>
        </div>
      </div>
    `;
  }

  function renderStrukDigitalModal(state) {
    const totalCart = window.getTotalCartAmount ? window.getTotalCartAmount() : 0;

    // Format tanggal: D/M/YY (contoh: 15/2/26)
    const now = new Date();
    const d = now.getDate();
    const m = now.getMonth() + 1;
    const yy = String(now.getFullYear()).slice(-2);
    const dateFormatted = `${d}/${m}/${yy}`;

    // Format nomor urut biasa (1, 2, dst)
    const rawNumber = state.receiptCounter || 1;

    // Format pembeli: 'Umum' atau nama pembeli jika ada input
    const buyerName =
      state.buyerInfo && state.buyerInfo.trim() && state.buyerInfo.trim().toLowerCase() !== 'umum'
        ? state.buyerInfo.trim()
        : 'Umum';

    const headerInfoText = `No. ${rawNumber}-${dateFormatted}, ${buyerName}`;

    return `
      <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-0.5 sm:p-4">
        <div class="bg-white rounded-xl sm:rounded-2xl shadow-2xl struk-modal-card w-full max-w-full sm:max-w-xl p-2 sm:p-5 relative overflow-hidden animate-zoomIn max-h-[96vh] overflow-y-auto">
          <div class="receipt-container w-full bg-white rounded-xl border-2 border-slate-300 p-3 sm:p-5 font-mono text-slate-900" style="font-size: 20px; line-height: 1.35;">
            <div class="text-center pb-1">
              <div class="receipt-title font-black text-center text-slate-900 tracking-wide" style="font-size: 22px; font-weight: 900; line-height: 1.2;">
                KANTIN KDMP SINDUADI
              </div>
            </div>

            <div class="receipt-header-info text-slate-800 font-bold py-1.5 border-b-2 border-slate-200" style="font-size: 18px; line-height: 1.3;">
              ${headerInfoText}
            </div>

            <!-- Area Daftar Pembelian dengan Overlay Watermark Transparan -->
            <div class="relative py-1">
              ${
                state.isPaid
                  ? `
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10" aria-hidden="true">
                  <div class="stamp-lunas-overlay">
                    LUNAS
                  </div>
                </div>
              `
                  : ''
              }

              <div class="space-y-0.5 max-h-80 overflow-y-auto pr-1">
                ${state.cart
                  .map(
                    (item) => `
                  <div class="receipt-item-row flex justify-between items-baseline py-0.5 leading-snug" style="font-size: 20px;">
                    <span class="receipt-item-name font-semibold text-slate-900">${item.qty}x ${item.produk}</span>
                    <span class="receipt-item-price font-bold text-slate-900 whitespace-nowrap ml-3">Rp ${(item.qty * item.hargaJual).toLocaleString('id-ID')}</span>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <div class="receipt-total-box flex justify-between items-baseline pt-2 mt-2 border-t-2 border-slate-800" style="font-size: 20px;">
              <span class="receipt-total-label font-bold text-slate-900" style="font-size: 20px; font-weight: 800;">Total:</span>
              <span class="receipt-total-val font-black text-blue-700 whitespace-nowrap" style="font-size: 20px; font-weight: 900;">Rp ${totalCart.toLocaleString('id-ID')}</span>
            </div>

            ${
              state.isPaid && state.bayarNominal
                ? `
              <div class="receipt-payment-info text-center font-bold text-slate-700 pt-1.5 mt-1.5 border-t border-dashed border-slate-300 whitespace-nowrap" style="font-size: 14px; line-height: 1.2;">
                Dibayar ${Number(state.bayarNominal).toLocaleString('id-ID')} kembali ${Math.max(
                    0,
                    Number(state.bayarNominal) - totalCart
                  ).toLocaleString('id-ID')}
              </div>
            `
                : ''
            }
          </div>
        </div>
      </div>
    `;
  }

  function renderTutupWarningModal(state) {
    return `
      <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-6 animate-zoomIn">
          <div class="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <i data-lucide="alert-triangle" class="w-8 h-8"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-900">Konfirmasi Penutupan</h2>
            <p class="text-slate-600 text-sm mt-2 leading-relaxed">
              KASIR AKAN DITUTUP. SCAN QR ID PETUGAS (${state.petugas ? state.petugas.nama : ''}) UNTUK MELANJUTKAN.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3 pt-2">
            <button id="btn-cancel-tutup" class="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-sm transition cursor-pointer">
              Batal / Kembali
            </button>
            <button id="btn-confirm-tutup" class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
              Konfirmasi Tutup
            </button>
          </div>
          <button id="btn-open-sim-from-tutup" class="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-blue-200 cursor-pointer">
            <i data-lucide="qr-code" class="w-4 h-4"></i>
            Buka Scanner QR Petugas
          </button>
        </div>
      </div>
    `;
  }

  function renderOpnameProdukModal(state) {
    return `
      <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-3">
        <div class="bg-white shadow-2xl w-full max-w-full sm:max-w-5xl h-full sm:h-auto max-h-screen sm:max-h-[94vh] flex flex-col overflow-hidden p-2 sm:p-5 space-y-3 animate-zoomIn rounded-none sm:rounded-2xl">
          <div class="flex items-center justify-between pb-1 border-b border-slate-200 px-1">
            <div>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900">Opname Stok Produk</h2>
              <p class="text-[11px] sm:text-xs text-slate-500">
                Verifikasi stok sisa fisik di etalase dan tentukan selisih jika ada.
              </p>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto overflow-x-auto border border-slate-200 rounded-xl w-full">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200 font-bold">
                <tr>
                  <th class="p-2 sm:p-3">Produk</th>
                  <th class="p-2 sm:p-3">Penitip</th>
                  <th class="p-2 sm:p-3 text-center whitespace-nowrap">Stok Sistem</th>
                  <th class="p-2 sm:p-3 text-center whitespace-nowrap">opname</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${
                  state.opnameList.length > 0
                    ? state.opnameList
                        .map(
                          (item, idx) => `
                    <tr class="${item.done ? 'bg-emerald-50/70 text-slate-600' : 'hover:bg-slate-50'}">
                      <td class="p-2 sm:p-3 font-semibold text-slate-900">${item.produk}</td>
                      <td class="p-2 sm:p-3 text-slate-600">${item.penitip}</td>
                      <td class="p-2 sm:p-3 text-center font-bold text-slate-800">${item.qty}</td>
                      <td class="p-2 sm:p-3 text-center whitespace-nowrap">
                        ${
                          !item.done
                            ? `
                          <div class="inline-flex items-center justify-center gap-1.5">
                            <button data-opname-selisih="${idx}" title="Input Selisih (+/-)" class="btn-opname-selisih px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black rounded-lg text-xs sm:text-sm transition active:scale-95 border border-amber-300 cursor-pointer">
                              +/-
                            </button>
                            <button data-opname-sesuai="${idx}" title="Sesuai / Selesai (✓)" class="btn-opname-sesuai px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs sm:text-sm transition active:scale-95 flex items-center justify-center border border-emerald-700 shadow-xs cursor-pointer">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                          </div>
                        `
                            : `
                          <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-md border border-emerald-300">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-emerald-700">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            ${item.selisih !== 0 ? `<span>(${item.selisih > 0 ? `+${item.selisih}` : item.selisih})</span>` : ''}
                          </span>
                        `
                        }
                      </td>
                    </tr>
                  `
                        )
                        .join('')
                    : `
                  <tr>
                    <td colspan="4" class="p-6 text-center text-slate-400">
                      Tidak ada produk dalam daftar opname.
                    </td>
                  </tr>
                `
                }
              </tbody>
            </table>
          </div>

          <button id="btn-finish-opname" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Selesai Opname & Download Laporan Retur (PDF)</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderDialogSelisihModal(state) {
    return `
      <div id="modal-dialog-selisih" class="modal-dialog-selisih fixed inset-0 z-[99990] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-6 text-center space-y-4 animate-zoomIn">
          <h3 class="font-bold text-slate-900">Input Selisih Stok</h3>
          <p class="text-xs text-slate-500">
            (- menandakan stok kurang/rusak, + menandakan stok berlebih)
          </p>
          <div class="flex items-center justify-center space-x-5 py-2">
            <button id="btn-minus-selisih" class="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xl font-bold transition flex items-center justify-center cursor-pointer">
              <i data-lucide="minus" class="w-4 h-4"></i>
            </button>
            <span class="text-3xl font-extrabold text-blue-600 w-16 text-center">
              ${state.activeSelisihQty > 0 ? `+${state.activeSelisihQty}` : state.activeSelisihQty}
            </span>
            <button id="btn-plus-selisih" class="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xl font-bold transition flex items-center justify-center cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4"></i>
            </button>
          </div>
          <button id="btn-save-selisih" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition cursor-pointer">
            Simpan Selisih
          </button>
        </div>
      </div>
    `;
  }

  function renderHasilLabaModal(state) {
    const totalLaba = window.getTotalLabaKantin ? window.getTotalLabaKantin() : 0;
    return `
      <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-zoomIn">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <i data-lucide="calculator" class="w-6 h-6"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-900">Hasil Perhitungan Laba</h2>
              <p class="text-xs text-slate-500">Pembagian laba usaha kantin sesuai proporsi</p>
            </div>
          </div>

          <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 font-mono text-sm">
            <div class="flex justify-between text-slate-900 font-bold border-b border-slate-200 pb-2">
              <span>Laba Total Kantin:</span>
              <span class="text-emerald-700">Rp ${totalLaba.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-blue-800">
              <span>20% PAD (Pendapatan Desa):</span>
              <strong>Rp ${Math.round(totalLaba * 0.2).toLocaleString('id-ID')}</strong>
            </div>
            <div class="flex justify-between text-indigo-800">
              <span>30% KDMP Sinduadi:</span>
              <strong>Rp ${Math.round(totalLaba * 0.3).toLocaleString('id-ID')}</strong>
            </div>
            <div class="flex justify-between text-emerald-800">
              <span>50% Upah Operasional:</span>
              <strong>Rp ${Math.round(totalLaba * 0.5).toLocaleString('id-ID')}</strong>
            </div>
          </div>

          <button id="btn-lanjut-opname-kas" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer">
            <span>Lanjutkan ke Opname Kas</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }

  function renderOpnameKasModal(state) {
    const kasSistem = window.getTotalKasSistem ? window.getTotalKasSistem() : 0;
    return `
      <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-zoomIn">
          <h2 class="text-xl font-bold text-slate-900">Opname Kas Akhir</h2>

          <div class="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-1.5">
            <div class="flex justify-between">
              <span class="text-slate-500">Kas Awal:</span>
              <strong class="text-slate-800">Rp ${Number(state.kasAwal).toLocaleString('id-ID')}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Kas Tercatat Sistem (Cash Masuk):</span>
              <strong class="text-blue-700">Rp ${kasSistem.toLocaleString('id-ID')}</strong>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Kas Riil di Laci Kasir
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
              <input
                type="number"
                id="input-kas-riil"
                value="${state.kasRiil}"
                placeholder="${kasSistem}"
                class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden text-lg font-bold text-slate-900"
              />
            </div>
            <p class="text-[11px] text-slate-500 mt-1">
              Default: Rp ${kasSistem.toLocaleString('id-ID')} (sesuai kas sistem). Ketuk untuk mengosongkan jika kas fisik berbeda.
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Catatan Selisih (Opsional)
            </label>
            <input
              type="text"
              id="input-catatan-selisih"
              value="${state.catatanSelisihKas}"
              placeholder="Alasan selisih kas bila ada..."
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden text-sm text-slate-800"
            />
          </div>

          <button id="btn-proses-penutupan-final" class="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-rose-200 cursor-pointer">
            PROSES PENUTUPAN & DOWNLOAD LAPORAN (PDF)
          </button>
        </div>
      </div>
    `;
  }

  function renderSimModal(state) {
    return `
      <div id="modal-simulasi-qr" class="modal-simulasi-qr fixed inset-0 z-[100000] bg-slate-900/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-zoomIn">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div class="flex items-center gap-2">
              <i data-lucide="qr-code" class="w-5 h-5 text-blue-600"></i>
              <h3 class="font-bold text-slate-800 text-sm">Simulasi Input Scan QR</h3>
            </div>
            <button id="btn-close-sim" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="p-4 overflow-y-auto space-y-4 flex-1">
            <!-- 1. Tombol Kecil: produk 1, produk 2, petugas, pembeli -->
            <div class="space-y-1.5">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Simulasi Scan QR
              </span>
              <div class="grid grid-cols-4 gap-2">
                <button id="btn-sim-prod-1" class="px-2 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition text-center truncate active:scale-95 cursor-pointer" title="${state.sampleProducts[0] || ''}">
                  produk 1
                </button>
                <button id="btn-sim-prod-2" class="px-2 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition text-center truncate active:scale-95 cursor-pointer" title="${state.sampleProducts[1] || ''}">
                  produk 2
                </button>
                <button id="btn-sim-petugas" class="px-2 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition text-center truncate active:scale-95 cursor-pointer" title="3404123456789012,Budi Santoso">
                  petugas
                </button>
                <button id="btn-sim-pembeli" class="px-2 py-2 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl transition text-center truncate active:scale-95 cursor-pointer" title="3404987654321098,Siti Aminah">
                  pembeli
                </button>
              </div>
            </div>

            <!-- 2. Susunan Karakter Kontrol: ^ di atas, < | OK | > di tengah, ! di bawah -->
            <div class="space-y-1.5 pt-1">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center">
                Karakter Kontrol
              </span>
              <div class="flex flex-col items-center justify-center py-1">
                <!-- Di atas: ^ -->
                <button id="btn-sim-up" class="w-16 h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base rounded-xl transition flex flex-col items-center justify-center shadow-xs active:scale-95 cursor-pointer" title="^ (+5)">
                  <span>^</span>
                  <span class="text-[9px] text-slate-400 font-normal leading-none">+5</span>
                </button>

                <!-- Di tengah: < | OK | > -->
                <div class="flex items-center gap-3 my-2">
                  <button id="btn-sim-left" class="w-16 h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base rounded-xl transition flex flex-col items-center justify-center shadow-xs active:scale-95 cursor-pointer" title="< (Kurang)">
                    <span>&lt;</span>
                    <span class="text-[9px] text-slate-400 font-normal leading-none">Kurang</span>
                  </button>

                  <button id="btn-sim-ok" class="w-24 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-xl transition flex flex-col items-center justify-center shadow-md shadow-emerald-200 active:scale-95 cursor-pointer" title="OK (Simpan / Lunas)">
                    <span>OK</span>
                    <span class="text-[9px] text-emerald-100 font-normal leading-none">Simpan / Lunas</span>
                  </button>

                  <button id="btn-sim-right" class="w-16 h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base rounded-xl transition flex flex-col items-center justify-center shadow-xs active:scale-95 cursor-pointer" title="> (Tambah)">
                    <span>&gt;</span>
                    <span class="text-[9px] text-slate-400 font-normal leading-none">Tambah</span>
                  </button>
                </div>

                <!-- Di bawah: ! -->
                <button id="btn-sim-down" class="w-16 h-11 ${
                  state.step === 'struk_digital'
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold'
                } text-base rounded-xl transition flex flex-col items-center justify-center shadow-xs active:scale-95 cursor-pointer" title="${
                  state.step === 'struk_digital' ? '! (Batal)' : '! (-5)'
                }">
                  <span>!</span>
                  <span class="text-[9px] ${
                    state.step === 'struk_digital' ? 'text-rose-600 font-bold' : 'text-slate-400 font-normal'
                  } leading-none">${state.step === 'struk_digital' ? 'Batal' : '-5'}</span>
                </button>
              </div>
            </div>

            <!-- 3. Simulasi Input QR Nominal Pembayaran Tunai -->
            <div class="space-y-1.5 pt-2 border-t border-slate-100">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center">
                Nominal QR Pembayaran
              </span>
              <div class="grid grid-cols-5 gap-1.5">
                <button id="btn-sim-cash-5000" onclick="if(window.handleQR)window.handleQR('5000')" class="btn-sim-cash py-2 px-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition text-center truncate active:scale-95 cursor-pointer" data-val="5000" title="QR: 5000">
                  5.000
                </button>
                <button id="btn-sim-cash-10000" onclick="if(window.handleQR)window.handleQR('10000')" class="btn-sim-cash py-2 px-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition text-center truncate active:scale-95 cursor-pointer" data-val="10000" title="QR: 10000">
                  10.000
                </button>
                <button id="btn-sim-cash-20000" onclick="if(window.handleQR)window.handleQR('20000')" class="btn-sim-cash py-2 px-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition text-center truncate active:scale-95 cursor-pointer" data-val="20000" title="QR: 20000">
                  20.000
                </button>
                <button id="btn-sim-cash-50000" onclick="if(window.handleQR)window.handleQR('50000')" class="btn-sim-cash py-2 px-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition text-center truncate active:scale-95 cursor-pointer" data-val="50000" title="QR: 50000">
                  50.000
                </button>
                <button id="btn-sim-cash-100000" onclick="if(window.handleQR)window.handleQR('100000')" class="btn-sim-cash py-2 px-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition text-center truncate active:scale-95 cursor-pointer" data-val="100000" title="QR: 100000">
                  100.000
                </button>
              </div>
            </div>

            <!-- 4. Mode Virtual Serial (USB CDC / Virtual COM) -->
            <div class="space-y-1.5 pt-2 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Mode Virtual Serial (USB COM)
                </span>
                <span id="serial-status-badge" class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500">
                  Belum Terhubung
                </span>
              </div>
              <button id="btn-connect-serial" class="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer">
                <i data-lucide="cable" class="w-4 h-4"></i>
                <span>Hubungkan Mesin Scanner (Serial USB)</span>
              </button>
            </div>

            <!-- 4b. Mode Keyboard Serial (IME kustom) -->
            <div class="space-y-1.5 pt-2 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Mode Keyboard Serial (IME)
                </span>
                <span id="ime-status-badge" class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500">
                  Mati
                </span>
              </div>
              <button id="btn-ime-mode" class="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer">
                Aktifkan Mode Keyboard Serial
              </button>
              <p class="text-[10px] text-slate-400 leading-snug">
                Aktifkan hanya jika scanner terhubung lewat aplikasi keyboard (IME) kustom. Pilih keyboard itu sebagai keyboard aktif di pengaturan ponsel.
              </p>
            </div>

            <!-- 5. Paling Bawah: Input Ketik Kode QR -->
            <div class="space-y-1.5 pt-3 border-t border-slate-100">
              <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Ketik Kode QR:
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  id="input-custom-qr"
                  value="${state.customQrInput}"
                  placeholder="Ketik kode QR bebas..."
                  class="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                />
                <button id="btn-send-custom-qr" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer">
                  Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderFloatingButton(state) {
    const isPulsing =
      state.step === 'warning' ||
      state.step === 'tambah_titipan' ||
      state.step === 'struk_digital' ||
      state.step === 'tutup_warning';

    return `
      <div id="floating-qr-container" class="floating-qr-container fixed bottom-6 right-6 z-[99999] pointer-events-auto">
        <button id="btn-open-sim" class="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center transition-all transform active:scale-95 focus:outline-hidden focus:ring-4 focus:ring-blue-300 relative group cursor-pointer" title="Buka Scanner QR / Simulator">
          <i data-lucide="qr-code" class="w-7 h-7"></i>
          ${
            isPulsing
              ? `
            <span class="absolute -top-1 -right-1 flex h-4 w-4">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white"></span>
            </span>
          `
              : ''
          }
        </button>
      </div>
    `;
  }

  function renderOfflineIndicator() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return `
        <div class="fixed bottom-6 left-6 z-40 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <i data-lucide="wifi-off" class="w-4 h-4"></i>
          <span>Mode Offline - Data tetap tersimpan lokal</span>
        </div>
      `;
    }
    return '';
  }

  function generateAppHtml(state) {
    let html = '';
    html += renderHeader(state);
    html += renderMainTable(state);

    if (state.step === 'check_db') {
      html += renderCheckDbModal(state);
    } else if (state.step === 'warning') {
      html += renderWarningModal(state);
    } else if (state.step === 'kas_awal') {
      html += renderKasAwalModal(state);
    } else if (state.step === 'tambah_titipan') {
      html += renderTambahTitipanModal(state);
    } else if (state.step === 'struk_digital') {
      html += renderStrukDigitalModal(state);
    } else if (state.step === 'tutup_warning') {
      html += renderTutupWarningModal(state);
    } else if (state.step === 'opname_produk') {
      html += renderOpnameProdukModal(state);
    } else if (state.step === 'hasil_laba') {
      html += renderHasilLabaModal(state);
    } else if (state.step === 'opname_kas') {
      html += renderOpnameKasModal(state);
    }

    if (state.showDialogSelisih) {
      html += renderDialogSelisihModal(state);
    }

    if (state.showSimModal) {
      html += renderSimModal(state);
    }

    html += renderFloatingButton(state);
    html += renderOfflineIndicator();

    // Kolom penerima scanner dibuat sekali di events.js (di luar #app) agar fokus dan
    // koneksi keyboard (IME) tidak hilang setiap kali tampilan dirender ulang.

    return html;
  }

  // Export to global
  window.KDMPViews = {
    renderHeader,
    renderMainTable,
    renderCheckDbModal,
    renderWarningModal,
    renderKasAwalModal,
    renderTambahTitipanModal,
    renderStrukDigitalModal,
    renderTutupWarningModal,
    renderOpnameProdukModal,
    renderDialogSelisihModal,
    renderHasilLabaModal,
    renderOpnameKasModal,
    renderSimModal,
    renderFloatingButton,
    renderOfflineIndicator,
    generateAppHtml
  };

  window.generateAppHtml = generateAppHtml;
})();
