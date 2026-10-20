/**
 * Kantin KDMP Sinduadi - Sistem Kasir v.01
 * Modul Utama Aplikasi (Main App Controller & Inisialisasi)
 */

import './icons.js';
import './cipher.js';
import './db.js';
import './pdf.js';
import './state.js';
import './pwa.js';
import './views.js';
import './events.js';

(function () {
  'use strict';

  // --- CORE QR CODE HANDLER ---
  async function handleQR(rawCode) {
    const state = window.state;
    if (!state) return;

    state.showSimModal = false;
    const data = (rawCode || '').trim();
    if (!data) return;
    const parts = data.split(',');
    let scannedNik = '';
    let scannedNama = '';

    const decryptFn = window.decryptPrice || (window.KDMPCipher && window.KDMPCipher.decryptPrice);
    const getKeyFn = window.getProductKey || (window.KDMPCipher && window.KDMPCipher.getProductKey);

    // 1. QR PRODUK (min 4 parts: Produk, Penitip, HargaJual, KodeEnkripsi)
    if (parts.length >= 4 && !isNaN(Number(parts[2].trim()))) {
      if (state.step === 'warning' || state.step === 'check_db') {
        state.petugas = state.petugas || { nik: '3404123456789012', nama: 'Budi Santoso' };
        state.kasAwal = state.kasAwal || 100000;
        state.step = 'main';
      }

      const produk = parts[0].trim();
      const penitip = parts[1].trim();
      const hargaJual = Number(parts[2].trim());
      const encCode = parts[3].trim();
      const hargaTitipDecrypted = decryptFn ? decryptFn(produk, penitip, encCode) : 0;
      const productKey = getKeyFn ? getKeyFn(produk, penitip) : `${produk}__${penitip}`;

      if (state.step === 'main') {
        const existingIndex = state.products.findIndex(
          (p) => (p.key || (getKeyFn ? getKeyFn(p.produk, p.penitip) : `${p.produk}__${p.penitip}`)) === productKey
        );

        if (existingIndex === -1 || state.products[existingIndex].qty <= 0) {
          state.currentProduct = {
            key: productKey,
            produk,
            penitip,
            hargaJual,
            hargaTitipDecrypted,
            hargaTitipEnc: encCode,
          };
          state.currentQty = 0;
          state.step = 'tambah_titipan';
          renderApp();
        } else {
          if (window.updateDateTime) window.updateDateTime();
          const existing = state.products[existingIndex];
          if (existing.qty > 0) {
            existing.qty -= 1;
            if (state.db && window.upsertProductInDB) {
              await window.upsertProductInDB(state.db, existing);
            }
            state.cart = [
              {
                produk,
                penitip,
                hargaJual,
                hargaTitip: existing.hargaTitipDecrypted || hargaTitipDecrypted,
                qty: 1,
              },
            ];
            state.isPaid = false;
            state.step = 'struk_digital';
            renderApp();
          }
        }
      } else if (state.step === 'struk_digital') {
        const existingIndex = state.products.findIndex(
          (p) => (p.key || (getKeyFn ? getKeyFn(p.produk, p.penitip) : `${p.produk}__${p.penitip}`)) === productKey
        );

        if (existingIndex !== -1 && state.products[existingIndex].qty > 0) {
          const existing = state.products[existingIndex];
          existing.qty -= 1;
          if (state.db && window.upsertProductInDB) {
            await window.upsertProductInDB(state.db, existing);
          }

          const itemIndex = state.cart.findIndex(
            (item) =>
              (item.penitip
                ? (getKeyFn ? getKeyFn(item.produk, item.penitip) : `${item.produk}__${item.penitip}`) === productKey
                : item.produk.toLowerCase() === produk.toLowerCase())
          );
          if (itemIndex !== -1) {
            state.cart[itemIndex].qty += 1;
          } else {
            state.cart.push({
              produk,
              penitip,
              hargaJual,
              hargaTitip: existing.hargaTitipDecrypted || hargaTitipDecrypted,
              qty: 1,
            });
          }
          renderApp();
        }
      }
      return;
    }

    // 2. QR ID PETUGAS (NIK 16 digit, Nama)
    if (parts.length >= 2 && parts[0].trim().length === 16 && isNaN(Number(parts[1].trim()))) {
      scannedNik = parts[0].trim();
      scannedNama = parts[1].trim();

      if (state.step === 'main') {
        if (state.petugas && state.petugas.nik === scannedNik) {
          state.step = 'tutup_warning';
          renderApp();
        }
        return;
      }

      if (state.step === 'tutup_warning') {
        if (state.petugas && state.petugas.nik === scannedNik) {
          confirmTutupKasir();
        } else {
          state.step = 'main';
          renderApp();
        }
        return;
      }

      if (state.step === 'warning') {
        state.petugas = { nik: scannedNik, nama: scannedNama };
        state.step = 'kas_awal';
        renderApp();
        return;
      }

      if (state.step === 'struk_digital') {
        state.buyerInfo = scannedNama;
        renderApp();
        return;
      }
    }

    // 3. STEP KAS AWAL -> 'OK'
    if (state.step === 'kas_awal') {
      if (data === 'OK') {
        const nominal = state.tempKasAwal.trim() === '' ? 0 : Number(state.tempKasAwal);
        state.kasAwal = isNaN(nominal) ? 0 : Math.max(0, nominal);
        state.step = 'main';
        renderApp();
      }
      return;
    }

    // 4. STEP TAMBAH TITIPAN -> QTY CONTROLS
    if (state.step === 'tambah_titipan') {
      if (data === '>') {
        state.currentQty += 1;
        renderApp();
      } else if (data === '<') {
        state.currentQty = Math.max(0, state.currentQty - 1);
        renderApp();
      } else if (data === '^') {
        state.currentQty += 5;
        renderApp();
      } else if (data === '!') {
        state.currentQty = Math.max(0, state.currentQty - 5);
        renderApp();
      } else if (data === 'OK') {
        if (state.currentQty > 0 && state.currentProduct.produk && state.currentProduct.penitip) {
          const k = state.currentProduct.key || (getKeyFn ? getKeyFn(state.currentProduct.produk, state.currentProduct.penitip) : `${state.currentProduct.produk}__${state.currentProduct.penitip}`);
          const existingIdx = state.products.findIndex(
            (p) => (p.key || (getKeyFn ? getKeyFn(p.produk, p.penitip) : `${p.produk}__${p.penitip}`)) === k
          );
          const prevInitialQty = existingIdx !== -1 ? state.products[existingIdx].initialQty : undefined;
          const newProduct = {
            key: k,
            produk: state.currentProduct.produk,
            penitip: state.currentProduct.penitip,
            hargaJual: Number(state.currentProduct.hargaJual),
            hargaTitipEnc: state.currentProduct.hargaTitipEnc,
            hargaTitipDecrypted: state.currentProduct.hargaTitipDecrypted,
            qty: state.currentQty,
            initialQty: prevInitialQty !== undefined ? prevInitialQty + state.currentQty : state.currentQty,
          };

          if (existingIdx !== -1) {
            state.products[existingIdx] = newProduct;
          } else {
            state.products.push(newProduct);
          }

          if (state.db && window.upsertProductInDB) {
            await window.upsertProductInDB(state.db, newProduct);
          }
        }
        state.step = 'main';
        renderApp();
      }
      return;
    }

    // 5. STEP STRUK DIGITAL -> TRANSAKSI
    if (state.step === 'struk_digital') {
      if (state.isPaid) {
        state.isPaid = false;
        state.cart = [];
        state.buyerInfo = 'Umum';
        state.receiptCounter += 1;
        state.step = 'main';
        renderApp();
        return;
      }

      // Tambah item terakhir: '>'
      if (data === '>') {
        if (state.cart.length > 0) {
          const lastItem = state.cart[state.cart.length - 1];
          const k = getKeyFn ? getKeyFn(lastItem.produk, lastItem.penitip || '') : `${lastItem.produk}__${lastItem.penitip}`;
          const dbIndex = state.products.findIndex(
            (p) =>
              (p.key || (getKeyFn ? getKeyFn(p.produk, p.penitip) : `${p.produk}__${p.penitip}`)) === k ||
              p.produk.toLowerCase() === lastItem.produk.toLowerCase()
          );
          if (dbIndex !== -1 && state.products[dbIndex].qty > 0) {
            state.products[dbIndex].qty -= 1;
            if (state.db && window.upsertProductInDB) {
              await window.upsertProductInDB(state.db, state.products[dbIndex]);
            }
            lastItem.qty += 1;
            renderApp();
          }
        }
        return;
      }

      // Kurang item terakhir: '<'
      if (data === '<') {
        if (state.cart.length > 0) {
          const lastIndex = state.cart.length - 1;
          const lastItem = state.cart[lastIndex];
          const k = getKeyFn ? getKeyFn(lastItem.produk, lastItem.penitip || '') : `${lastItem.produk}__${lastItem.penitip}`;
          const dbIndex = state.products.findIndex(
            (p) =>
              (p.key || (getKeyFn ? getKeyFn(p.produk, p.penitip) : `${p.produk}__${p.penitip}`)) === k ||
              p.produk.toLowerCase() === lastItem.produk.toLowerCase()
          );
          if (dbIndex !== -1) {
            state.products[dbIndex].qty += 1;
            if (state.db && window.upsertProductInDB) {
              await window.upsertProductInDB(state.db, state.products[dbIndex]);
            }
          }

          if (lastItem.qty > 1) {
            lastItem.qty -= 1;
          } else {
            state.cart.splice(lastIndex, 1);
            if (state.cart.length === 0) {
              state.step = 'main';
            }
          }
          renderApp();
        }
        return;
      }

      // Batal seluruh transaksi: '!' (dipindah dari '^')
      if (data === '!') {
        for (const item of state.cart) {
          const k = getKeyFn ? getKeyFn(item.produk, item.penitip || '') : `${item.produk}__${item.penitip}`;
          const dbIdx = state.products.findIndex(
            (p) =>
              (p.key || (getKeyFn ? getKeyFn(p.produk, p.penitip) : `${p.produk}__${p.penitip}`)) === k ||
              p.produk.toLowerCase() === item.produk.toLowerCase()
          );
          if (dbIdx !== -1) {
            state.products[dbIdx].qty += item.qty;
          }
        }
        if (state.db && window.syncProductsToDB) {
          await window.syncProductsToDB(state.db, state.products);
        }
        state.cart = [];
        state.buyerInfo = 'Umum';
        state.step = 'main';
        renderApp();
        return;
      }

      // Tambah +5 item terakhir: '^'
      if (data === '^') {
        if (state.cart.length > 0) {
          const lastItem = state.cart[state.cart.length - 1];
          const k = getKeyFn ? getKeyFn(lastItem.produk, lastItem.penitip || '') : `${lastItem.produk}__${lastItem.penitip}`;
          const dbIndex = state.products.findIndex(
            (p) =>
              (p.key || (getKeyFn ? getKeyFn(p.produk, p.penitip) : `${p.produk}__${p.penitip}`)) === k ||
              p.produk.toLowerCase() === lastItem.produk.toLowerCase()
          );
          if (dbIndex !== -1 && state.products[dbIndex].qty > 0) {
            const addQty = Math.min(5, state.products[dbIndex].qty);
            state.products[dbIndex].qty -= addQty;
            if (state.db && window.upsertProductInDB) {
              await window.upsertProductInDB(state.db, state.products[dbIndex]);
            }
            lastItem.qty += addQty;
            renderApp();
          }
        }
        return;
      }

      // Pelunasan: 'OK'
      if (data === 'OK') {
        state.isPaid = true;
        if (state.cart.length > 0) {
          const totalCart = window.getTotalCartAmount ? window.getTotalCartAmount() : 0;
          const receiptNum = window.getReceiptNumber ? window.getReceiptNumber() : '001';
          const settledTx = {
            no: receiptNum,
            items: [...state.cart],
            total: totalCart,
            pembeli: state.buyerInfo,
            petugas: state.petugas ? state.petugas.nama : 'Petugas',
            timestamp: state.receiptDate,
          };
          const exists = state.transactionHistory.some((t) => t.no === settledTx.no);
          if (!exists) {
            state.transactionHistory.push(settledTx);
          }
          if (state.db && window.saveTransactionToDB) {
            await window.saveTransactionToDB(state.db, settledTx);
          }
        }
        renderApp();
        return;
      }
    }
  }

  // --- OPNAME DAN PENUTUPAN KASIR ---
  function confirmTutupKasir() {
    const state = window.state;
    if (!state) return;

    state.opnameList = state.products.map((p) => ({
      ...p,
      done: false,
      selisih: 0,
    }));
    state.step = 'opname_produk';
    renderApp();
  }

  function selesaiItemOpname(index) {
    const state = window.state;
    if (!state) return;

    if (state.opnameList[index]) {
      state.opnameList[index].selisih = 0;
      state.opnameList[index].done = true;
    }
    renderApp();
  }

  function bukaDialogSelisih(index) {
    const state = window.state;
    if (!state) return;

    state.activeSelisihIndex = index;
    state.activeSelisihQty = 0;
    state.showDialogSelisih = true;
    renderApp();
  }

  function simpanSelisih() {
    const state = window.state;
    if (!state) return;

    if (state.activeSelisihIndex !== null && state.opnameList[state.activeSelisihIndex]) {
      state.opnameList[state.activeSelisihIndex].selisih = state.activeSelisihQty;
      state.opnameList[state.activeSelisihIndex].done = true;
    }
    state.showDialogSelisih = false;
    state.activeSelisihIndex = null;
    renderApp();
  }

  function selesaiOpnameProduk() {
    const state = window.state;
    if (!state) return;

    const decryptFn = window.decryptPrice || (window.KDMPCipher && window.KDMPCipher.decryptPrice);
    const getKeyFn = window.getProductKey || (window.KDMPCipher && window.KDMPCipher.getProductKey);

    state.opnameList.forEach((item) => {
      item.done = true;
    });

    const returResults = state.opnameList.map((item) => {
      const pKey = item.key || (getKeyFn ? getKeyFn(item.produk, item.penitip) : `${item.produk}__${item.penitip}`);
      const totalLaku = state.transactionHistory.reduce((sum, tx) => {
        const itemSold = tx.items.find(
          (ti) =>
            (ti.penitip ? (getKeyFn ? getKeyFn(ti.produk, ti.penitip) : `${ti.produk}__${ti.penitip}`) === pKey : false) ||
            (ti.produk.toLowerCase() === item.produk.toLowerCase() &&
              (!ti.penitip || ti.penitip.toLowerCase() === item.penitip.toLowerCase()))
        );
        return sum + (itemSold ? itemSold.qty : 0);
      }, 0);

      const sisaRetur = Math.max(0, item.qty + (item.selisih || 0));
      const jumlahTitipan =
        item.initialQty !== undefined && item.initialQty > 0
          ? Math.max(item.initialQty, totalLaku + sisaRetur)
          : totalLaku + sisaRetur;

      const hargaTitipEstimasi =
        item.hargaTitipDecrypted ||
        (decryptFn ? decryptFn(item.produk, item.penitip, item.hargaTitipEnc || '') : 0) ||
        Math.round(item.hargaJual * 0.8);

      const uangBayar = totalLaku * hargaTitipEstimasi;

      return {
        produk: item.produk,
        penitip: item.penitip,
        jumlahTitipan,
        laku: totalLaku,
        sisaRetur,
        hargaTitip: hargaTitipEstimasi,
        uangBayar,
      };
    });

    // Urutkan berdasarkan Penitip (A-Z), lalu Produk (A-Z)
    returResults.sort((a, b) => {
      const pComp = (a.penitip || '').localeCompare(b.penitip || '', 'id-ID', { sensitivity: 'base' });
      if (pComp !== 0) return pComp;
      return (a.produk || '').localeCompare(b.produk || '', 'id-ID', { sensitivity: 'base' });
    });

    state.opnameReturResults = returResults;

    // Unduh PDF Laporan Retur & Pembayaran Penitip
    try {
      if (window.generateReturPdf) {
        window.generateReturPdf(returResults, state.petugas ? state.petugas.nama : 'Petugas Kasir', new Date());
      }
    } catch (e) {
      console.error('Gagal generate PDF retur:', e);
    }

    state.step = 'hasil_laba';
    renderApp();
  }

  function lanjutKeOpnameKas() {
    const state = window.state;
    if (!state) return;

    state.kasRiil = String(window.getTotalKasSistem ? window.getTotalKasSistem() : 0);
    state.step = 'opname_kas';
    renderApp();
  }

  async function prosesPenutupanFinal() {
    const state = window.state;
    if (!state) return;

    const labaTotal = window.getTotalLabaKantin ? window.getTotalLabaKantin() : 0;
    const pad20 = Math.round(labaTotal * 0.2);
    const kdmp30 = Math.round(labaTotal * 0.3);
    const upah50 = Math.round(labaTotal * 0.5);
    const totalPenjualan = state.transactionHistory.reduce((sum, tx) => sum + tx.total, 0);
    const totalSistem = window.getTotalKasSistem ? window.getTotalKasSistem() : 0;

    const nominalKasRiil = state.kasRiil.trim() === '' ? totalSistem : Number(state.kasRiil);
    const kasRiilFinal = isNaN(nominalKasRiil) ? totalSistem : nominalKasRiil;

    // Unduh PDF Berita Acara Penutupan Kasir
    try {
      if (window.generateLabaPenutupanPdf) {
        window.generateLabaPenutupanPdf({
          petugasNama: state.petugas ? state.petugas.nama : 'Petugas',
          kasAwal: Number(state.kasAwal || 0),
          kasRiil: kasRiilFinal,
          catatanSelisih: state.catatanSelisihKas,
          totalPenjualan,
          totalTransaksi: state.transactionHistory.length,
          labaTotal,
          pad20,
          kdmp30,
          upah50,
        });
      }
    } catch (e) {
      console.error('Gagal generate PDF laba penutupan:', e);
    }

    // Backup JSON file
    const dbBackup = {
      petugas: state.petugas,
      kasAwal: state.kasAwal,
      kasRiil: kasRiilFinal,
      catatanSelisihKas: state.catatanSelisihKas,
      riwayatTransaksi: state.transactionHistory,
      dataOpnameRetur: state.opnameReturResults,
      pembagianLaba: {
        labaTotal,
        pad20,
        kdmp30,
        upah50,
      },
      timestamp: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dbBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `database_kantin_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    // Reset DB
    if (state.db && window.clearAllDatabaseStores) {
      await window.clearAllDatabaseStores(state.db);
    }

    state.products = [];
    state.petugas = null;
    state.kasAwal = 0;
    state.tempKasAwal = '';
    state.cart = [];
    state.transactionHistory = [];
    state.receiptCounter = 1;
    state.step = 'warning';
    renderApp();
  }

  // --- RENDER APP & BINDING ---
  function renderApp() {
    const appContainer = document.getElementById('app');
    if (!appContainer || !window.state || !window.generateAppHtml) return;

    appContainer.innerHTML = window.generateAppHtml(window.state);

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    if (window.attachEventListeners) {
      window.attachEventListeners();
    }
  }

  // Online / Offline listeners
  window.addEventListener('online', () => renderApp());
  window.addEventListener('offline', () => renderApp());

  // Export functions to global
  window.handleQR = handleQR;
  window.confirmTutupKasir = confirmTutupKasir;
  window.selesaiItemOpname = selesaiItemOpname;
  window.bukaDialogSelisih = bukaDialogSelisih;
  window.simpanSelisih = simpanSelisih;
  window.selesaiOpnameProduk = selesaiOpnameProduk;
  window.lanjutKeOpnameKas = lanjutKeOpnameKas;
  window.prosesPenutupanFinal = prosesPenutupanFinal;
  window.renderApp = renderApp;

  // --- INITIALIZATION ---
  if (window.initSamples) {
    window.initSamples();
  }

  if (window.openDatabase) {
    window.openDatabase()
      .then(async (db) => {
        window.state.db = db;
        const [storedProducts, storedTransactions] = await Promise.all([
          window.fetchAllProducts(db),
          window.fetchAllTransactions(db),
        ]);
        window.state.products = storedProducts;
        window.state.transactionHistory = storedTransactions;
        if (storedTransactions.length > 0) {
          window.state.receiptCounter = storedTransactions.length + 1;
        }
        if (storedProducts.length > 0 || storedTransactions.length > 0) {
          window.state.step = 'check_db';
        } else {
          window.state.step = 'warning';
          window.state.receiptCounter = 1;
        }
        renderApp();
      })
      .catch((err) => {
        console.warn('Gagal membuka IndexedDB:', err);
        window.state.step = 'warning';
        renderApp();
      });
  } else {
    window.state.step = 'warning';
    renderApp();
  }
})();
