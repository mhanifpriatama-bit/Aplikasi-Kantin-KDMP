/**
 * Kantin KDMP Sinduadi - Modul Laporan PDF
 * Menghasilkan Dokumen Berita Acara & Laporan Retur menggunakan jsPDF Standar
 * Format Kertas: A5
 * Tipografi:
 * - Judul Utama (Heading 1): 22 pt (rentang 20-24 pt)
 * - Sub-judul (Heading 2): 16 pt (rentang 16-18 pt)
 * - Teks Utama (Body Text): 12 pt (rentang 12-14 pt)
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

  function generateReturPdf(returResults, petugasNama, tutupTimestamp) {
    // Ukuran Kertas A5 (Portrait: 148 x 210 mm)
    const doc = getJsPdfInstance({ orientation: 'portrait', unit: 'mm', format: 'a5' });
    const pageWidth = 148;
    const margin = 8;
    const tableWidth = pageWidth - margin * 2; // 132 mm
    let y = 16;

    // Judul tabel : Retur dan Pembayaran Produk (Heading 1: 22 pt)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text('Retur dan Pembayaran Produk', margin, y);

    y += 9;

    // Diurutkan sesuai nama penitip (A-Z), jika sama urutkan sesuai nama produk (A-Z)
    const sortedList = [...(returResults || [])].sort((a, b) => {
      const pComp = (a.penitip || '').localeCompare(b.penitip || '', 'id-ID', { sensitivity: 'base' });
      if (pComp !== 0) return pComp;
      return (a.produk || '').localeCompare(b.produk || '', 'id-ID', { sensitivity: 'base' });
    });

    // 6 Kolom: produk, penitip, titipan, retur, laku, pembayaran
    // Total tableWidth = 132 mm (36 + 26 + 16 + 16 + 16 + 22 = 132 mm)
    const colX = [margin, margin + 36, margin + 62, margin + 78, margin + 94, margin + 110];
    const colW = [36, 26, 16, 16, 16, 22];

    function drawTableHeader(curY) {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, curY, tableWidth, 8, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, curY, tableWidth, 8, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      doc.text('Produk', colX[0] + 2, curY + 5.5);
      doc.text('Penitip', colX[1] + 2, curY + 5.5);
      doc.text('Titipan', colX[2] + colW[2] / 2, curY + 5.5, { align: 'center' });
      doc.text('Retur', colX[3] + colW[3] / 2, curY + 5.5, { align: 'center' });
      doc.text('Laku', colX[4] + colW[4] / 2, curY + 5.5, { align: 'center' });
      doc.text('Pembayaran', colX[5] + colW[5] - 2, curY + 5.5, { align: 'right' });
    }

    drawTableHeader(y);
    y += 8;

    const rowHeight = 7.5;
    sortedList.forEach((item, index) => {
      // Cek batas halaman A5
      if (y + rowHeight > 190) {
        doc.addPage();
        y = 16;
        drawTableHeader(y);
        y += 8;
      }

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, tableWidth, rowHeight, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);

      const prodText = (item.produk || '').slice(0, 19);
      const penText = (item.penitip || '').slice(0, 13);
      const titipanVal = String(item.jumlahTitipan !== undefined ? item.jumlahTitipan : 0);
      const returVal = String(item.sisaRetur !== undefined ? item.sisaRetur : 0);
      const lakuVal = String(item.laku !== undefined ? item.laku : 0);
      const bayarVal = `Rp ${(item.uangBayar || 0).toLocaleString('id-ID')}`;

      doc.text(prodText, colX[0] + 2, y + 5);
      doc.text(penText, colX[1] + 2, y + 5);
      doc.text(titipanVal, colX[2] + colW[2] / 2, y + 5, { align: 'center' });
      doc.text(returVal, colX[3] + colW[3] / 2, y + 5, { align: 'center' });
      doc.text(lakuVal, colX[4] + colW[4] / 2, y + 5, { align: 'center' });
      doc.text(bayarVal, colX[5] + colW[5] - 2, y + 5, { align: 'right' });

      y += rowHeight;
    });

    // Di bawah tabel, ditulis nama petugas, jam dan tanggal ditutup.
    // Itu saja, jangan tambahkan apapun.
    y += 8;
    if (y + 18 > 195) {
      doc.addPage();
      y = 16;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12); // Body Text: 12 pt
    doc.setTextColor(30, 41, 59);

    const closeDate = tutupTimestamp ? new Date(tutupTimestamp) : new Date();
    const jamTanggalStr = closeDate.toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    doc.text(`Petugas : ${petugasNama || 'Petugas Kasir'}`, margin, y);
    y += 6;
    doc.text(`Ditutup : ${jamTanggalStr}`, margin, y);

    doc.save(`laporan_retur_opname_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function generateLabaPenutupanPdf(data) {
    // Ukuran Kertas A5 (Portrait: 148 x 210 mm)
    const doc = getJsPdfInstance({ orientation: 'portrait', unit: 'mm', format: 'a5' });
    const pageWidth = 148;
    const margin = 10;
    const boxWidth = pageWidth - margin * 2; // 128 mm
    let y = 14;

    // Judul Utama (Heading 1: 22 pt)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('KANTIN KDMP SINDUADI', margin, y);

    y += 6.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12); // Body Text
    doc.setTextColor(100, 116, 139);
    doc.text('Sistem Kasir v.01 - Kalurahan Sinduadi', margin, y);

    y += 3.5;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);

    // Sub-judul (Heading 2: 16 pt)
    y += 7.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    const subTitleLines = doc.splitTextToSize('BERITA ACARA PENUTUPAN KASIR & PEMBAGIAN LABA', boxWidth);
    doc.text(subTitleLines, margin, y);
    y += subTitleLines.length * 6;

    // Metadata (Body Text: 12 pt)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
    doc.text(`Tanggal/Waktu : ${nowStr}`, margin, y);
    y += 5.5;
    doc.text(`Petugas Kasir : ${data.petugasNama || 'Petugas'}`, margin, y);

    // Section 1: Rekonsiliasi Kas (Heading 2: 16 pt)
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Rekonsiliasi Kas Kasir', margin, y);

    y += 4;
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, boxWidth, 40, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, boxWidth, 40, 'S');

    const kasItems = [
      { label: 'Kas Awal Pagi (Kembalian)', val: `Rp ${data.kasAwal.toLocaleString('id-ID')}` },
      { label: `Total Penjualan (${data.totalTransaksi} Transaksi)`, val: `Rp ${data.totalPenjualan.toLocaleString('id-ID')}` },
      { label: 'Kas Tercatat Sistem', val: `Rp ${(data.kasAwal + data.totalPenjualan).toLocaleString('id-ID')}` },
      { label: 'Kas Riil Fisik di Laci', val: `Rp ${data.kasRiil.toLocaleString('id-ID')}` },
      {
        label: `Selisih Kas ${data.catatanSelisih ? `(${data.catatanSelisih})` : ''}`,
        val: `Rp ${(data.kasRiil - (data.kasAwal + data.totalPenjualan)).toLocaleString('id-ID')}`,
      },
    ];

    let ky = y + 6.5;
    kasItems.forEach((row, i) => {
      doc.setFont('helvetica', i === 4 ? 'bold' : 'normal');
      doc.setFontSize(12); // Body Text: 12 pt
      doc.setTextColor(i === 4 ? 185 : 51, i === 4 ? 28 : 65, i === 4 ? 28 : 85);
      doc.text(row.label, margin + 4, ky);
      doc.text(row.val, pageWidth - margin - 4, ky, { align: 'right' });
      ky += 7.2;
    });

    // Section 2: Pembagian Laba (Heading 2: 16 pt)
    y += 45;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('2. Pembagian Hasil Laba Kantin', margin, y);

    y += 4;
    doc.setFillColor(240, 253, 244);
    doc.rect(margin, y, boxWidth, 33, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.rect(margin, y, boxWidth, 33, 'S');

    const labaItems = [
      { label: 'Total Laba Bersih Kantin', val: `Rp ${data.labaTotal.toLocaleString('id-ID')}` },
      { label: '20% PAD (Desa Sinduadi)', val: `Rp ${data.pad20.toLocaleString('id-ID')}` },
      { label: '30% KDMP Sinduadi', val: `Rp ${data.kdmp30.toLocaleString('id-ID')}` },
      { label: '50% Upah Petugas Kasir', val: `Rp ${data.upah50.toLocaleString('id-ID')}` },
    ];

    let ly = y + 6.5;
    labaItems.forEach((row, i) => {
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.setFontSize(12); // Body Text: 12 pt
      doc.setTextColor(i === 0 ? 21 : 51, i === 0 ? 128 : 65, i === 0 ? 61 : 85);
      doc.text(row.label, margin + 4, ly);
      doc.text(row.val, pageWidth - margin - 4, ly, { align: 'right' });
      ly += 7.2;
    });

    // Signatures (Body Text: 12 pt)
    y += 38;
    if (y + 25 > 200) {
      doc.addPage();
      y = 14;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);

    doc.text('Petugas Kasir,', margin + 6, y);
    doc.text('Pengurus KDMP,', pageWidth - margin - 48, y);

    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.text(`( ${data.petugasNama || 'Petugas'} )`, margin + 2, y);
    doc.text('( ........................... )', pageWidth - margin - 50, y);

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
