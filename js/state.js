/**
 * Kantin KDMP Sinduadi - Modul Pengelolaan State Aplikasi
 * State terpusat untuk alur kasir, produk, opname, dan kalkulasi keuangan
 */

(function () {
  'use strict';

  const state = {
    db: null,
    step: 'check_db', // 'check_db' | 'warning' | 'kas_awal' | 'main' | 'tambah_titipan' | 'struk_digital' | 'tutup_warning' | 'opname_produk' | 'hasil_laba' | 'opname_kas'
    petugas: null, // { nik, nama }
    kasAwal: 0,
    tempKasAwal: '',
    products: [],
    currentProduct: {},
    currentQty: 0,
    receiptCounter: 1,
    cart: [],
    buyerInfo: 'Umum',
    isPaid: false,
    receiptDate: '',
    transactionHistory: [],
    opnameList: [],
    opnameReturResults: [],
    kasRiil: '',
    catatanSelisihKas: '',
    showDialogSelisih: false,
    activeSelisihIndex: null,
    activeSelisihQty: 0,
    showSimModal: false,
    customQrInput: '',
    sampleProducts: [],
    deferredPrompt: null,
    isInstalled: false,
    isIOS: false,
    showIOSPrompt: false
  };

  function initSamples() {
    const encryptFn = window.encryptPrice || (window.KDMPCipher && window.KDMPCipher.encryptPrice);
    const enc1 = encryptFn ? encryptFn('Keripik Singkong', 'Ibu Ani', 8000) : 'ABC';
    const enc2 = encryptFn ? encryptFn('Kue Lapis', 'Pak Joko', 4000) : 'DEF';

    state.sampleProducts = [
      `Keripik Singkong,Ibu Ani,10000,${enc1}`,
      `Kue Lapis,Pak Joko,5000,${enc2}`
    ];
  }

  function getReceiptNumber() {
    return String(state.receiptCounter).padStart(3, '0');
  }

  function getTotalCartAmount() {
    return state.cart.reduce((sum, item) => sum + item.qty * item.hargaJual, 0);
  }

  function getTotalLabaKantin() {
    const labaTransaksi = state.transactionHistory.reduce((sum, tx) => {
      const marginTx = tx.items.reduce((itemSum, item) => {
        const hBeli = item.hargaTitip || item.hargaJual * 0.8;
        return itemSum + (item.hargaJual - hBeli) * item.qty;
      }, 0);
      return sum + marginTx;
    }, 0);
    return Math.max(labaTransaksi, 0);
  }

  function getTotalKasSistem() {
    const totalPenjualan = state.transactionHistory.reduce((sum, tx) => sum + tx.total, 0);
    return Number(state.kasAwal || 0) + totalPenjualan;
  }

  function updateDateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    state.receiptDate = `${hours}:${minutes}, ${day}/${month}/${year}`;
  }

  // Export ke global
  window.state = state;
  window.KDMPState = {
    state,
    initSamples,
    getReceiptNumber,
    getTotalCartAmount,
    getTotalLabaKantin,
    getTotalKasSistem,
    updateDateTime
  };

  window.initSamples = initSamples;
  window.getReceiptNumber = getReceiptNumber;
  window.getTotalCartAmount = getTotalCartAmount;
  window.getTotalLabaKantin = getTotalLabaKantin;
  window.getTotalKasSistem = getTotalKasSistem;
  window.updateDateTime = updateDateTime;
})();
