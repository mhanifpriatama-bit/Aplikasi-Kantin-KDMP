/**
 * Kantin KDMP Sinduadi - Modul Event & Interaksi Pengguna
 * Mengatur interaksi tombol, keyboard shortcut fisik, dan listener input
 */

(function () {
  'use strict';

  function attachEventListeners() {
    const state = window.state;
    if (!state) return;

    // Database handlers
    const btnDbContinue = document.getElementById('btn-db-continue');
    if (btnDbContinue) {
      btnDbContinue.onclick = () => {
        state.step = 'warning';
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    const btnDbReset = document.getElementById('btn-db-reset');
    if (btnDbReset) {
      btnDbReset.onclick = async () => {
        if (state.db && window.clearAllDatabaseStores) {
          await window.clearAllDatabaseStores(state.db);
        }
        state.products = [];
        state.receiptCounter = 1;
        state.transactionHistory = [];
        state.step = 'warning';
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    // Warning stage: open QR simulation
    const btnOpenPetugasSim = document.getElementById('btn-open-petugas-sim');
    if (btnOpenPetugasSim) {
      btnOpenPetugasSim.onclick = () => {
        state.showSimModal = true;
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    // Kas awal inputs & button
    const inputKasAwal = document.getElementById('input-kas-awal');
    if (inputKasAwal) {
      inputKasAwal.oninput = (e) => {
        state.tempKasAwal = e.target.value;
      };
      inputKasAwal.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (typeof window.handleQR === 'function') window.handleQR('OK');
        }
      };
    }

    const btnSaveKasAwal = document.getElementById('btn-save-kas-awal');
    if (btnSaveKasAwal) {
      btnSaveKasAwal.onclick = () => {
        if (typeof window.handleQR === 'function') window.handleQR('OK');
      };
    }

    // Tutup warning
    const btnCancelTutup = document.getElementById('btn-cancel-tutup');
    if (btnCancelTutup) {
      btnCancelTutup.onclick = () => {
        state.step = 'main';
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    const btnConfirmTutup = document.getElementById('btn-confirm-tutup');
    if (btnConfirmTutup) {
      btnConfirmTutup.onclick = () => {
        if (typeof window.confirmTutupKasir === 'function') {
          window.confirmTutupKasir();
        }
      };
    }

    const btnOpenSimFromTutup = document.getElementById('btn-open-sim-from-tutup');
    if (btnOpenSimFromTutup) {
      btnOpenSimFromTutup.onclick = () => {
        state.showSimModal = true;
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    // Tambah titipan modal buttons
    const btnTitipMinus5 = document.getElementById('btn-titip-minus-5');
    if (btnTitipMinus5) btnTitipMinus5.onclick = () => window.handleQR && window.handleQR('!');

    const btnTitipMinus1 = document.getElementById('btn-titip-minus-1');
    if (btnTitipMinus1) btnTitipMinus1.onclick = () => window.handleQR && window.handleQR('<');

    const btnTitipPlus1 = document.getElementById('btn-titip-plus-1');
    if (btnTitipPlus1) btnTitipPlus1.onclick = () => window.handleQR && window.handleQR('>');

    const btnTitipPlus5 = document.getElementById('btn-titip-plus-5');
    if (btnTitipPlus5) btnTitipPlus5.onclick = () => window.handleQR && window.handleQR('^');

    const btnTitipOk = document.getElementById('btn-titip-ok');
    if (btnTitipOk) btnTitipOk.onclick = () => window.handleQR && window.handleQR('OK');

    const btnOpenSimFromTitipan = document.getElementById('btn-open-sim-from-titipan');
    if (btnOpenSimFromTitipan) {
      btnOpenSimFromTitipan.onclick = () => {
        state.showSimModal = true;
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    // Struk digital modal buttons
    const btnStrukMinus = document.getElementById('btn-struk-minus');
    if (btnStrukMinus) btnStrukMinus.onclick = () => window.handleQR && window.handleQR('<');

    const btnStrukPlus = document.getElementById('btn-struk-plus');
    if (btnStrukPlus) btnStrukPlus.onclick = () => window.handleQR && window.handleQR('>');

    const btnStrukCancel = document.getElementById('btn-struk-cancel');
    if (btnStrukCancel) btnStrukCancel.onclick = () => window.handleQR && window.handleQR('!');

    const btnStrukOk = document.getElementById('btn-struk-ok');
    if (btnStrukOk) btnStrukOk.onclick = () => window.handleQR && window.handleQR('OK');

    const btnOpenSimFromStruk = document.getElementById('btn-open-sim-from-struk');
    if (btnOpenSimFromStruk) {
      btnOpenSimFromStruk.onclick = () => {
        state.showSimModal = true;
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    const btnStrukNext = document.getElementById('btn-struk-next');
    if (btnStrukNext) {
      btnStrukNext.onclick = () => {
        state.isPaid = false;
        state.cart = [];
        state.buyerInfo = 'Umum';
        state.receiptCounter += 1;
        state.step = 'main';
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    // Opname actions
    document.querySelectorAll('.btn-opname-selisih').forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-opname-selisih'));
        if (typeof window.bukaDialogSelisih === 'function') {
          window.bukaDialogSelisih(idx);
        }
      };
    });

    document.querySelectorAll('.btn-opname-sesuai').forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-opname-sesuai'));
        if (typeof window.selesaiItemOpname === 'function') {
          window.selesaiItemOpname(idx);
        }
      };
    });

    const btnMinusSelisih = document.getElementById('btn-minus-selisih');
    if (btnMinusSelisih) {
      btnMinusSelisih.onclick = () => {
        state.activeSelisihQty -= 1;
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    const btnPlusSelisih = document.getElementById('btn-plus-selisih');
    if (btnPlusSelisih) {
      btnPlusSelisih.onclick = () => {
        state.activeSelisihQty += 1;
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    const btnSaveSelisih = document.getElementById('btn-save-selisih');
    if (btnSaveSelisih) {
      btnSaveSelisih.onclick = () => {
        if (typeof window.simpanSelisih === 'function') {
          window.simpanSelisih();
        }
      };
    }

    const btnFinishOpname = document.getElementById('btn-finish-opname');
    if (btnFinishOpname) {
      btnFinishOpname.onclick = () => {
        if (typeof window.selesaiOpnameProduk === 'function') {
          window.selesaiOpnameProduk();
        }
      };
    }

    const btnLanjutOpnameKas = document.getElementById('btn-lanjut-opname-kas');
    if (btnLanjutOpnameKas) {
      btnLanjutOpnameKas.onclick = () => {
        if (typeof window.lanjutKeOpnameKas === 'function') {
          window.lanjutKeOpnameKas();
        }
      };
    }

    // Opname kas inputs
    const inputKasRiil = document.getElementById('input-kas-riil');
    if (inputKasRiil) {
      inputKasRiil.onfocus = () => {
        state.kasRiil = '';
        inputKasRiil.value = '';
      };
      inputKasRiil.oninput = (e) => {
        state.kasRiil = e.target.value;
      };
      inputKasRiil.onblur = () => {
        if (state.kasRiil.trim() === '') {
          state.kasRiil = String(window.getTotalKasSistem ? window.getTotalKasSistem() : 0);
          inputKasRiil.value = state.kasRiil;
        }
      };
    }

    const inputCatatanSelisih = document.getElementById('input-catatan-selisih');
    if (inputCatatanSelisih) {
      inputCatatanSelisih.oninput = (e) => {
        state.catatanSelisihKas = e.target.value;
      };
    }

    const btnProsesPenutupanFinal = document.getElementById('btn-proses-penutupan-final');
    if (btnProsesPenutupanFinal) {
      btnProsesPenutupanFinal.onclick = () => {
        if (typeof window.prosesPenutupanFinal === 'function') {
          window.prosesPenutupanFinal();
        }
      };
    }

    // Edit qty manual in table
    document.querySelectorAll('.btn-edit-qty').forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-edit-idx'));
        editQtyManual(idx);
      };
    });

    // Download Single HTML File
    const btnDownloadHtml = document.getElementById('btn-download-html');
    if (btnDownloadHtml) {
      btnDownloadHtml.onclick = () => {
        downloadSingleFileHtml();
      };
    }

    // PWA install button & iOS close
    const btnPwaInstall = document.getElementById('btn-pwa-install');
    if (btnPwaInstall) {
      btnPwaInstall.onclick = () => {
        if (typeof window.triggerInstallPWA === 'function') {
          window.triggerInstallPWA();
        }
      };
    }

    const closeIosPrompt = document.getElementById('close-ios-prompt');
    if (closeIosPrompt) {
      closeIosPrompt.onclick = () => {
        state.showIOSPrompt = false;
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    // QR Simulator trigger & buttons
    const btnOpenSim = document.getElementById('btn-open-sim');
    if (btnOpenSim) {
      btnOpenSim.onclick = () => {
        state.showSimModal = true;
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    const btnCloseSim = document.getElementById('btn-close-sim');
    if (btnCloseSim) {
      btnCloseSim.onclick = () => {
        state.showSimModal = false;
        if (typeof window.renderApp === 'function') window.renderApp();
      };
    }

    const btnSimProd1 = document.getElementById('btn-sim-prod-1');
    if (btnSimProd1) {
      btnSimProd1.onclick = () => {
        if (state.step === 'warning' || state.step === 'check_db') {
          state.petugas = state.petugas || { nik: '3404123456789012', nama: 'Budi Santoso' };
          state.kasAwal = state.kasAwal || 100000;
          state.step = 'main';
        }
        if (typeof window.handleQR === 'function') {
          window.handleQR(state.sampleProducts[0]);
        }
      };
    }

    const btnSimProd2 = document.getElementById('btn-sim-prod-2');
    if (btnSimProd2) {
      btnSimProd2.onclick = () => {
        if (state.step === 'warning' || state.step === 'check_db') {
          state.petugas = state.petugas || { nik: '3404123456789012', nama: 'Budi Santoso' };
          state.kasAwal = state.kasAwal || 100000;
          state.step = 'main';
        }
        if (typeof window.handleQR === 'function') {
          window.handleQR(state.sampleProducts[1]);
        }
      };
    }

    const btnSimPetugas = document.getElementById('btn-sim-petugas');
    if (btnSimPetugas) {
      btnSimPetugas.onclick = () => {
        if (typeof window.handleQR === 'function') {
          window.handleQR('3404123456789012,Budi Santoso');
        }
      };
    }

    const btnSimPembeli = document.getElementById('btn-sim-pembeli');
    if (btnSimPembeli) {
      btnSimPembeli.onclick = () => {
        if (typeof window.handleQR === 'function') {
          window.handleQR('3404987654321098,Siti Aminah');
        }
      };
    }

    const btnSimUp = document.getElementById('btn-sim-up');
    if (btnSimUp) {
      btnSimUp.onclick = () => window.handleQR && window.handleQR('^');
    }

    const btnSimLeft = document.getElementById('btn-sim-left');
    if (btnSimLeft) {
      btnSimLeft.onclick = () => window.handleQR && window.handleQR('<');
    }

    const btnSimOk = document.getElementById('btn-sim-ok');
    if (btnSimOk) {
      btnSimOk.onclick = () => window.handleQR && window.handleQR('OK');
    }

    const btnSimRight = document.getElementById('btn-sim-right');
    if (btnSimRight) {
      btnSimRight.onclick = () => window.handleQR && window.handleQR('>');
    }

    const btnSimDown = document.getElementById('btn-sim-down');
    if (btnSimDown) {
      btnSimDown.onclick = () => window.handleQR && window.handleQR('!');
    }

    // Nominal Bayar QR (5000, 10000, 20000, 50000, 100000)
    ['5000', '10000', '20000', '50000', '100000'].forEach((amt) => {
      const b = document.getElementById(`btn-sim-cash-${amt}`);
      if (b) {
        b.onclick = () => {
          if (typeof window.handleQR === 'function') {
            window.handleQR(amt);
          }
        };
      }
    });

    document.querySelectorAll('.btn-sim-cash').forEach((btn) => {
      btn.onclick = () => {
        const val = btn.getAttribute('data-val');
        if (val && typeof window.handleQR === 'function') {
          window.handleQR(val);
        }
      };
    });

    const inputCustomQr = document.getElementById('input-custom-qr');
    if (inputCustomQr) {
      inputCustomQr.oninput = (e) => {
        state.customQrInput = e.target.value;
      };
      inputCustomQr.onkeydown = (e) => {
        if (e.key === 'Enter' && state.customQrInput.trim()) {
          const val = state.customQrInput.trim();
          state.customQrInput = '';
          if (typeof window.handleQR === 'function') window.handleQR(val);
        }
      };
    }

    const btnSendCustomQr = document.getElementById('btn-send-custom-qr');
    if (btnSendCustomQr) {
      btnSendCustomQr.onclick = () => {
        if (state.customQrInput.trim()) {
          const val = state.customQrInput.trim();
          state.customQrInput = '';
          if (typeof window.handleQR === 'function') window.handleQR(val);
        }
      };
    }

    // Setup receiver input scanner hardware USB OTG
    const receiver = document.getElementById('barcode-scanner-receiver');
    if (receiver) {
      receiver.oninput = () => {
        const val = receiver.value;
        if (val.includes('\n') || val.includes('\r')) {
          const cleaned = val.replace(/[\r\n]+/g, '').trim();
          receiver.value = '';
          if (cleaned) processScannedBarcode(cleaned);
        }
      };
      receiver.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = receiver.value.trim();
          receiver.value = '';
          if (val) processScannedBarcode(val);
          else processScannedBarcode('OK');
        }
      };
    }
    setTimeout(keepScannerFocused, 30);
  }

  async function editQtyManual(index) {
    const state = window.state;
    if (!state) return;
    const item = state.products[index];
    if (!item) return;

    const newQtyStr = prompt(`Ubah jumlah produk "${item.produk}" (${item.penitip}):`, String(item.qty));
    if (newQtyStr !== null && !isNaN(Number(newQtyStr))) {
      const updatedQty = Math.max(0, parseInt(newQtyStr, 10));
      const k = item.key || (window.getProductKey ? window.getProductKey(item.produk, item.penitip) : `${item.produk}__${item.penitip}`);
      const updatedItem = { ...item, key: k, qty: updatedQty };
      state.products[index] = updatedItem;
      if (state.db && window.upsertProductInDB) {
        await window.upsertProductInDB(state.db, updatedItem);
      }
      if (typeof window.renderApp === 'function') window.renderApp();
    }
  }

  function downloadSingleFileHtml() {
    try {
      const htmlContent = '<!doctype html>\n' + document.documentElement.outerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Kantin_KDMP_Sinduadi_Kasir_v01_OFFLINE.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Gagal unduh file HTML:', e);
    }
  }

  // --- INTEGRASI MESIN PEMINDAI QR / BARCODE HARDWARE (USB OTG / BLUETOOTH HID) ---
  let scannerBuffer = '';
  let lastKeyTime = 0;
  let scannerTimeout = null;
  let lastProcessedCode = '';
  let lastProcessedTime = 0;

  function processScannedBarcode(raw) {
    const code = (raw || '').trim();
    if (!code) return;
    const now = Date.now();
    // Cegah eksekusi ganda jika event input dan keydown terpanggil bersamaan dalam rentang 180ms
    if (code === lastProcessedCode && now - lastProcessedTime < 180) {
      return;
    }
    lastProcessedCode = code;
    lastProcessedTime = now;

    scannerBuffer = '';
    const receiver = document.getElementById('barcode-scanner-receiver');
    if (receiver) receiver.value = '';

    if (typeof window.handleQR === 'function') {
      window.handleQR(code);
    }
  }

  function keepScannerFocused() {
    const active = document.activeElement;
    const isUserTyping =
      active &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') &&
      active.id !== 'barcode-scanner-receiver';

    if (!isUserTyping) {
      const receiver = document.getElementById('barcode-scanner-receiver');
      if (receiver && document.activeElement !== receiver) {
        try {
          receiver.focus({ preventScroll: true });
        } catch (err) {}
      }
    }
  }

  // Jaga fokus agar perangkat OTG USB selalu mengarah ke penerima data scanner
  document.addEventListener('click', () => keepScannerFocused());
  document.addEventListener('touchstart', () => keepScannerFocused(), { passive: true });

  // Listener Keyboard & Mesin Pemindai QR Hardware (Keyboard Wedge Buffer)
  window.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const isUserTyping =
      active &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') &&
      active.id !== 'barcode-scanner-receiver';

    // Jika sedang mengetik di input manual biasa
    if (isUserTyping) {
      if (e.key === 'Enter') {
        if (window.state && window.state.step === 'kas_awal') {
          e.preventDefault();
          processScannedBarcode('OK');
        }
      }
      return;
    }

    // Tombol kontrol panah keyboard fisik (ketika scanner buffer kosong)
    if (scannerBuffer.length === 0) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        processScannedBarcode('<');
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        processScannedBarcode('>');
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        processScannedBarcode('^');
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        processScannedBarcode('!');
        return;
      }
    }

    // Akhir dari pemindaian scanner (karakter Enter)
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(scannerTimeout);
      const receiver = document.getElementById('barcode-scanner-receiver');
      const valFromReceiver = receiver ? receiver.value.trim() : '';
      const scannedCode = valFromReceiver || scannerBuffer.trim();

      scannerBuffer = '';
      if (receiver) receiver.value = '';

      if (scannedCode.length > 0) {
        processScannedBarcode(scannedCode);
      } else {
        processScannedBarcode('OK');
      }
      return;
    }

    // Karakter isi yang dikirim oleh mesin pemindai barcode/QR
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const now = Date.now();
      // Jika jeda antar karakter lebih dari 600ms, anggap awal pemindaian baru
      if (now - lastKeyTime > 600) {
        scannerBuffer = '';
      }
      lastKeyTime = now;
      scannerBuffer += e.key;

      // Timeout cadangan untuk scanner yang tidak dikonfigurasi mengirim tombol Enter di akhir
      clearTimeout(scannerTimeout);
      scannerTimeout = setTimeout(() => {
        const receiver = document.getElementById('barcode-scanner-receiver');
        const code = (receiver && receiver.value.trim()) || scannerBuffer.trim();
        if (code.length > 1 || ['<', '>', '^', '!', 'OK'].includes(code)) {
          scannerBuffer = '';
          if (receiver) receiver.value = '';
          processScannedBarcode(code);
        }
      }, 150);
    }
  });

  // Export to global
  window.KDMPEvents = {
    attachEventListeners,
    editQtyManual,
    downloadSingleFileHtml
  };

  window.attachEventListeners = attachEventListeners;
  window.editQtyManual = editQtyManual;
  window.downloadSingleFileHtml = downloadSingleFileHtml;
})();
