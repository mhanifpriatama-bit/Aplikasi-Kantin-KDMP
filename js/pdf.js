/**
 * Kantin KDMP Sinduadi - Modul Laporan PDF
 * Menghasilkan Dokumen Berita Acara & Laporan Retur menggunakan jsPDF Standar
 */

(function () {
  'use strict';

  function getJsPdfInstance(options) {
    const jspdfModule = window.jspdf;
    if (jspdfModule && jspdfModule.jsPDF) {
      return new jspdfModule.jsPDF(options);
    } else if (typeof window.jsPDF === 'function') {
      return new window.jsPDF(options);
    }
    throw new Error('Pustaka jsPDF tidak ditemukan. Pastikan CDN atau script jsPDF telah dimuat.');
  }

  function generateReturPdf(returResults, petugasNama) {
    const doc = getJsPdfInstance({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const margin = 10;
    let y = 16;

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(30, 41, 59);
    doc.text('KANTIN KDMP SINDUADI', margin, y);

    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Sistem Kasir v.01 - Kalurahan Sinduadi', margin, y);

    y += 3.5;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('LAPORAN OPNAME RETUR & PEMBAYARAN PENITIP', margin, y);

    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
    doc.text(`Tanggal / Waktu : ${nowStr}`, margin, y);
    y += 4.5;
    doc.text(`Petugas Kasir   : ${petugasNama || 'Petugas Kasir'}`, margin, y);

    y += 6.5;
    // 9 Kolom: No, Nama Produk, Penitip, Titipan, Laku, Sisa (Retur), Harga Titip, Uang Bayar, Tanda Tangan
    const colX = [10, 17, 53, 79, 95, 108, 125, 146, 168, 190];
    const tableWidth = 190;

    // Header Bar
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, tableWidth, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, tableWidth, 8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 41, 59);

    doc.text('No', colX[0] + 3.5, y + 5.2, { align: 'center' });
    doc.text('Nama Produk', colX[1] + 1.5, y + 5.2);
    doc.text('Penitip', colX[2] + 1.5, y + 5.2);
    doc.text('Titipan', colX[3] + 14.5, y + 5.2, { align: 'right' });
    doc.text('Laku', colX[4] + 11.5, y + 5.2, { align: 'right' });
    doc.text('Sisa (Retur)', colX[5] + 15.5, y + 5.2, { align: 'right' });
    doc.text('Harga Titip', colX[6] + 19.5, y + 5.2, { align: 'right' });
    doc.text('Uang Bayar', colX[7] + 20.5, y + 5.2, { align: 'right' });
    doc.text('Tanda Tangan', colX[8] + 11, y + 5.2, { align: 'center' });

    y += 8;
    doc.setFont('helvetica', 'normal');

    let totalTitipanPcs = 0;
    let totalLakuPcs = 0;
    let totalReturPcs = 0;
    let totalUangBayar = 0;

    const rekapPenitip = {};

    returResults.forEach((item, index) => {
      if (y > 255) {
        doc.addPage();
        y = 18;
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, tableWidth, 8, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, y, tableWidth, 8, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(30, 41, 59);
        doc.text('No', colX[0] + 3.5, y + 5.2, { align: 'center' });
        doc.text('Nama Produk', colX[1] + 1.5, y + 5.2);
        doc.text('Penitip', colX[2] + 1.5, y + 5.2);
        doc.text('Titipan', colX[3] + 14.5, y + 5.2, { align: 'right' });
        doc.text('Laku', colX[4] + 11.5, y + 5.2, { align: 'right' });
        doc.text('Sisa (Retur)', colX[5] + 15.5, y + 5.2, { align: 'right' });
        doc.text('Harga Titip', colX[6] + 19.5, y + 5.2, { align: 'right' });
        doc.text('Uang Bayar', colX[7] + 20.5, y + 5.2, { align: 'right' });
        doc.text('Tanda Tangan', colX[8] + 11, y + 5.2, { align: 'center' });
        y += 8;
        doc.setFont('helvetica', 'normal');
      }

      totalTitipanPcs += item.jumlahTitipan;
      totalLakuPcs += item.laku;
      totalReturPcs += item.sisaRetur;
      totalUangBayar += item.uangBayar;

      const penKey = item.penitip || 'Tanpa Nama';
      if (!rekapPenitip[penKey]) {
        rekapPenitip[penKey] = { laku: 0, retur: 0, bayar: 0 };
      }
      rekapPenitip[penKey].laku += item.laku;
      rekapPenitip[penKey].retur += item.sisaRetur;
      rekapPenitip[penKey].bayar += item.uangBayar;

      const rowHeight = 7.5;
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, tableWidth, rowHeight, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight);

      doc.setFontSize(7.2);
      doc.setTextColor(30, 41, 59);

      doc.text(String(index + 1), colX[0] + 3.5, y + 4.8, { align: 'center' });
      doc.text(item.produk.slice(0, 26), colX[1] + 1.5, y + 4.8);
      doc.text(item.penitip.slice(0, 18), colX[2] + 1.5, y + 4.8);
      doc.text(String(item.jumlahTitipan), colX[3] + 14.5, y + 4.8, { align: 'right' });
      doc.text(String(item.laku), colX[4] + 11.5, y + 4.8, { align: 'right' });
      doc.text(String(item.sisaRetur), colX[5] + 15.5, y + 4.8, { align: 'right' });
      doc.text(`Rp ${item.hargaTitip.toLocaleString('id-ID')}`, colX[6] + 19.5, y + 4.8, { align: 'right' });
      doc.text(`Rp ${item.uangBayar.toLocaleString('id-ID')}`, colX[7] + 20.5, y + 4.8, { align: 'right' });

      // Garis tanda tangan / paraf penerima barang retur & uang
      doc.setDrawColor(203, 213, 225);
      doc.line(colX[8] + 2, y + 5.5, colX[8] + 20, y + 5.5);

      y += rowHeight;
    });

    // Summary box
    y += 3.5;
    if (y > 230) {
      doc.addPage();
      y = 18;
    }

    const summaryHeight = 12;
    doc.setFillColor(238, 242, 255);
    doc.rect(margin, y, tableWidth, summaryHeight, 'F');
    doc.setDrawColor(199, 210, 254);
    doc.rect(margin, y, tableWidth, summaryHeight, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(
      `Total: ${totalTitipanPcs} titipan | ${totalLakuPcs} laku | ${totalReturPcs} retur`,
      margin + 4,
      y + 7.5
    );
    doc.text(
      `Total Pembayaran Penitip: Rp ${totalUangBayar.toLocaleString('id-ID')}`,
      margin + tableWidth - 4,
      y + 7.5,
      { align: 'right' }
    );

    // Rekapitulasi per Penitip
    y += summaryHeight + 4;
    const daftarPenitipKeys = Object.keys(rekapPenitip);
    if (daftarPenitipKeys.length > 0) {
      if (y + daftarPenitipKeys.length * 5 + 35 > 280) {
        doc.addPage();
        y = 18;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Rincian Pembayaran per Penitip:', margin, y);
      y += 4.5;

      daftarPenitipKeys.forEach((penName) => {
        const pData = rekapPenitip[penName];
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(`• ${penName}`, margin + 3, y);
        doc.text(
          `Laku: ${pData.laku} pcs | Retur: ${pData.retur} pcs | Uang Diberikan: Rp ${pData.bayar.toLocaleString('id-ID')}`,
          margin + 60,
          y
        );
        y += 4.5;
      });
    }

    // Signatures
    y += 6;
    if (y > 245) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    doc.text('Petugas Kasir,', margin + 15, y);
    doc.text('Pengurus KDMP / Koordinator Titipan,', pageWidth - margin - 65, y);

    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.text(`( ${petugasNama || 'Petugas Kasir'} )`, margin + 10, y);
    doc.text('( ........................................ )', pageWidth - margin - 68, y);

    doc.save(`laporan_retur_opname_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function generateLabaPenutupanPdf(data) {
    const doc = getJsPdfInstance({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const margin = 15;
    let y = 18;

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('KANTIN KDMP SINDUADI', margin, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Sistem Kasir v.01 - Kalurahan Sinduadi', margin, y);

    y += 4;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('BERITA ACARA PENUTUPAN KASIR & PEMBAGIAN LABA', margin, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
    doc.text(`Tanggal / Waktu : ${nowStr}`, margin, y);
    y += 5;
    doc.text(`Petugas Kasir   : ${data.petugasNama || 'Petugas'}`, margin, y);

    // Section 1: Rekonsiliasi Kas
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('1. REKONSILIASI KAS KASIR', margin, y);

    y += 4;
    const kasBoxWidth = pageWidth - margin * 2;
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, kasBoxWidth, 42, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, kasBoxWidth, 42, 'S');

    const kasItems = [
      { label: 'Kas Awal Pagi (Uang Kembalian)', val: `Rp ${data.kasAwal.toLocaleString('id-ID')}` },
      { label: `Total Penjualan Masuk (${data.totalTransaksi} Transaksi)`, val: `Rp ${data.totalPenjualan.toLocaleString('id-ID')}` },
      { label: 'Kas Tercatat Sistem (Awal + Penjualan)', val: `Rp ${(data.kasAwal + data.totalPenjualan).toLocaleString('id-ID')}` },
      { label: 'Kas Riil Fisik di Laci Kasir', val: `Rp ${data.kasRiil.toLocaleString('id-ID')}` },
      {
        label: `Selisih Kas ${data.catatanSelisih ? `(${data.catatanSelisih})` : ''}`,
        val: `Rp ${(data.kasRiil - (data.kasAwal + data.totalPenjualan)).toLocaleString('id-ID')}`,
      },
    ];

    let ky = y + 7;
    kasItems.forEach((row, i) => {
      doc.setFont('helvetica', i === 4 ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(i === 4 ? 185 : 51, i === 4 ? 28 : 65, i === 4 ? 28 : 85);
      doc.text(row.label, margin + 4, ky);
      doc.text(row.val, pageWidth - margin - 4, ky, { align: 'right' });
      ky += 7;
    });

    // Section 2: Pembagian Laba
    y += 50;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('2. PEMBAGIAN HASIL LABA KANTIN', margin, y);

    y += 4;
    doc.setFillColor(240, 253, 244);
    doc.rect(margin, y, kasBoxWidth, 38, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.rect(margin, y, kasBoxWidth, 38, 'S');

    const labaItems = [
      { label: 'Total Laba Bersih Kantin', val: `Rp ${data.labaTotal.toLocaleString('id-ID')}` },
      { label: '20% PAD (Pendapatan Asli Desa Sinduadi)', val: `Rp ${data.pad20.toLocaleString('id-ID')}` },
      { label: '30% KDMP Sinduadi (Pengelola)', val: `Rp ${data.kdmp30.toLocaleString('id-ID')}` },
      { label: '50% Upah Operasional Petugas Kasir', val: `Rp ${data.upah50.toLocaleString('id-ID')}` },
    ];

    let ly = y + 7;
    labaItems.forEach((row, i) => {
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(i === 0 ? 21 : 51, i === 0 ? 128 : 65, i === 0 ? 61 : 85);
      doc.text(row.label, margin + 4, ly);
      doc.text(row.val, pageWidth - margin - 4, ly, { align: 'right' });
      ly += 7.5;
    });

    // Signatures
    y += 48;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    doc.text('Petugas Kasir,', margin + 15, y);
    doc.text('Pengurus KDMP Sinduadi,', pageWidth - margin - 55, y);

    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.text(`( ${data.petugasNama || 'Petugas'} )`, margin + 10, y);
    doc.text('( ................................ )', pageWidth - margin - 58, y);

    doc.save(`laporan_penutupan_kasir_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // Export to global scope
  window.KDMPPdf = {
    getJsPdfInstance,
    generateReturPdf,
    generateLabaPenutupanPdf
  };

  window.generateReturPdf = generateReturPdf;
  window.generateLabaPenutupanPdf = generateLabaPenutupanPdf;
})();
