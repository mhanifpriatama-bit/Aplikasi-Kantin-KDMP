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

    const btnConnectSerial = document.getElementById('btn-connect-serial');
    if (btnConnectSerial) {
      btnConnectSerial.onclick = () => {
        connectSerialScanner();
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
          // Hentikan bubbling: kalau tidak, listener window di bawah ikut memproses
          // Enter yang sama dan mengirim 'OK' ekstra tepat setelah kode hasil scan.
          e.stopPropagation();
          const val = receiver.value.trim() || scannerBuffer.trim();
          receiver.value = '';
          if (val) {
            markEnterTerminated(val);
            processScannedBarcode(val);
          } else if (!isRecentScanSuffix()) processScannedBarcode('OK');
        }
      };
    }
    setTimeout(keepScannerFocused, 30);
  }

  // --- KONEKSI VIRTUAL SERIAL (USB CDC ACM / VIRTUAL COM PORT) ---
  let activeSerialPort = null;
  let activeSerialReader = null;
  let isReadingSerial = false;

  async function connectSerialScanner() {
    if (!('serial' in navigator)) {
      alert(
        'Peramban (browser) ini belum mengaktifkan fitur Web Serial API secara langsung.\n\n' +
        'Solusi untuk HP Android:\n' +
        '1. Rekomendasi tercepat & termudah: Tetap gunakan USB HID Mode, lalu scan barcode "Inter-character delay 20ms" di buku manual scanner. Data panjang dijamin 100% tidak akan terpotong lagi.\n' +
        '2. Atau jika ingin Virtual Serial di HP: Buka URL chrome://flags di browser Chrome Android, cari "Enable Web Serial API on Android", ubah jadi Enabled, lalu buka kembali aplikasi ini.'
      );
      return;
    }

    try {
      if (activeSerialPort) {
        isReadingSerial = false;
        if (activeSerialReader) {
          try { await activeSerialReader.cancel(); } catch (e) {}
        }
        try { await activeSerialPort.close(); } catch (e) {}
        activeSerialPort = null;
        activeSerialReader = null;
        updateSerialStatus(false);
        return;
      }

      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      activeSerialPort = port;
      updateSerialStatus(true);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable).catch(() => {});
      const reader = textDecoder.readable.getReader();
      activeSerialReader = reader;
      isReadingSerial = true;

      let buffer = '';
      while (isReadingSerial) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          if (buffer.includes('\n') || buffer.includes('\r')) {
            const lines = buffer.split(/[\r\n]+/);
            buffer = lines.pop() || '';
            for (const line of lines) {
              const cleaned = line.trim();
              if (cleaned) {
                processScannedBarcode(cleaned);
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        console.warn('[Serial] Error connecting serial:', err);
      }
      updateSerialStatus(false);
    }
  }

  function updateSerialStatus(connected) {
    const badge = document.getElementById('serial-status-badge');
    const btn = document.getElementById('btn-connect-serial');
    if (badge) {
      if (connected) {
        badge.textContent = 'Terhubung';
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700';
      } else {
        badge.textContent = 'Belum Terhubung';
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500';
      }
    }
    if (btn) {
      if (connected) {
        btn.innerHTML = '<i data-lucide="unlink" class="w-4 h-4"></i><span>Putus Koneksi Scanner Serial</span>';
        btn.className = 'w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer';
      } else {
        btn.innerHTML = '<i data-lucide="cable" class="w-4 h-4"></i><span>Hubungkan Mesin Scanner (Serial USB)</span>';
        btn.className = 'w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer';
      }
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
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

  // Jika mesin pemindai terbukti mengirim Enter di akhir kode, timeout cadangan dimatikan
  // supaya scan yang datang agak lambat tidak terpotong di tengah jalan.
  let scannerUsesEnter = false;
  try { scannerUsesEnter = localStorage.getItem('kdmp_scanner_enter') === '1'; } catch (err) {}

  function markEnterTerminated(code) {
    if (code && code.length > 1 && !scannerUsesEnter) {
      scannerUsesEnter = true;
      try { localStorage.setItem('kdmp_scanner_enter', '1'); } catch (err) {}
    }
  }

  // Enter tunggal yang datang tepat setelah sebuah scan adalah akhiran Enter dari
  // mesin pemindai, bukan perintah OK dari petugas.
  function isRecentScanSuffix() {
    return lastProcessedCode !== 'OK' && Date.now() - lastProcessedTime < 400;
  }

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

    if (window.__kdmpDbgLog) window.__kdmpDbgLog('>>> PROSES scan: ' + JSON.stringify(code));
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
        markEnterTerminated(scannedCode);
        processScannedBarcode(scannedCode);
      } else if (!isRecentScanSuffix()) {
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

      // Timeout cadangan untuk scanner yang tidak dikonfigurasi mengirim tombol Enter di akhir.
      // Dimatikan jika scanner terbukti mengirim Enter, dan diberi jeda 400 ms (bukan 150 ms)
      // agar jeda antar-karakter yang agak lambat tidak memotong kode di tengah.
      clearTimeout(scannerTimeout);
      if (!scannerUsesEnter) {
        scannerTimeout = setTimeout(() => {
          const receiver = document.getElementById('barcode-scanner-receiver');
          const code = (receiver && receiver.value.trim()) || scannerBuffer.trim();
          if (code.length > 1 || ['<', '>', '^', '!', 'OK'].includes(code)) {
            scannerBuffer = '';
            if (receiver) receiver.value = '';
            processScannedBarcode(code);
          }
        }, 400);
      }
    }
  });

  // --- MODE DEBUG INPUT (aktif hanya jika alamat memakai ?debug=1) ---
  // Menampilkan semua kejadian keyboard/IME yang diterima browser, agar terlihat
  // bagaimana "serial keyboard" atau scanner mengirim data ke halaman.
  (function setupInputDebug() {
    try {
      if (!/[?&]debug=1(&|$)/.test(location.search)) return;
      const lines = [];
      let box = null;
      let pre = null;

      function desc(el) {
        if (!el) return '-';
        return (el.tagName || '?') + (el.id ? '#' + el.id : '');
      }

      function ensureBox() {
        if (box && document.body && document.body.contains(box)) return;
        if (!document.body) return;
        box = document.createElement('div');
        box.style.cssText =
          'position:fixed;left:4px;right:4px;top:4px;z-index:99999;max-height:46vh;display:flex;' +
          'flex-direction:column;border-radius:10px;background:rgba(15,23,42,.94);color:#d1fae5;' +
          'font:11px/1.35 monospace;';
        const bar = document.createElement('div');
        bar.style.cssText = 'display:flex;gap:6px;padding:6px;flex-wrap:wrap;';
        function mkBtn(label, fn) {
          const b = document.createElement('button');
          b.textContent = label;
          b.style.cssText = 'padding:4px 8px;border-radius:6px;background:#334155;color:#fff;font:11px monospace;border:0;';
          b.addEventListener('mousedown', (ev) => ev.preventDefault());
          b.addEventListener('touchstart', (ev) => ev.preventDefault(), { passive: false });
          b.addEventListener('click', fn);
          bar.appendChild(b);
          return b;
        }
        const modeBtn = mkBtn('inputmode: none', () => {
          const r = document.getElementById('barcode-scanner-receiver');
          if (!r) return;
          const now = r.getAttribute('inputmode') === 'none' ? 'text' : 'none';
          r.setAttribute('inputmode', now);
          modeBtn.textContent = 'inputmode: ' + now;
          log('receiver inputmode diubah menjadi ' + now + ' (ketuk layar lalu scan lagi)');
        });
        mkBtn('fokus receiver', () => {
          const r = document.getElementById('barcode-scanner-receiver');
          if (r) { try { r.focus(); } catch (err) {} }
          log('fokus sekarang: ' + desc(document.activeElement));
        });
        mkBtn('bersihkan', () => { lines.length = 0; render(); });
        pre = document.createElement('div');
        pre.style.cssText = 'padding:0 8px 8px;overflow:auto;white-space:pre-wrap;word-break:break-all;';
        box.appendChild(bar);
        box.appendChild(pre);
        document.body.appendChild(box);
      }

      function render() {
        ensureBox();
        if (!pre) return;
        pre.textContent = lines.join('\n');
        pre.scrollTop = pre.scrollHeight;
      }

      function log(msg) {
        const t = new Date();
        const stamp = String(t.getSeconds()).padStart(2, '0') + '.' + String(t.getMilliseconds()).padStart(3, '0');
        lines.push(stamp + ' ' + msg);
        if (lines.length > 60) lines.shift();
        render();
      }
      window.__kdmpDbgLog = log;

      const fmt = {
        keydown: (e) => 'keydown key=' + JSON.stringify(e.key) + ' code=' + e.code + ' kc=' + e.keyCode + ' @' + desc(e.target),
        beforeinput: (e) => 'beforeinput ' + e.inputType + ' data=' + JSON.stringify(e.data) + ' @' + desc(e.target),
        input: (e) => 'input ' + e.inputType + ' data=' + JSON.stringify(e.data) + ' nilai=' + JSON.stringify(e.target && e.target.value) + ' @' + desc(e.target),
        compositionstart: (e) => 'compositionstart @' + desc(e.target),
        compositionupdate: (e) => 'compositionupdate data=' + JSON.stringify(e.data),
        compositionend: (e) => 'compositionend data=' + JSON.stringify(e.data),
        focusin: (e) => 'focusin -> ' + desc(e.target),
        focusout: (e) => 'focusout <- ' + desc(e.target),
      };
      Object.keys(fmt).forEach((type) => {
        document.addEventListener(type, (e) => { try { log(fmt[type](e)); } catch (err) {} }, true);
      });

      log('MODE DEBUG aktif. Fokus: ' + desc(document.activeElement) +
        ' | inputmode receiver: ' + ((document.getElementById('barcode-scanner-receiver') || {}).getAttribute ? document.getElementById('barcode-scanner-receiver').getAttribute('inputmode') : '-'));
    } catch (err) {}
  })();

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
