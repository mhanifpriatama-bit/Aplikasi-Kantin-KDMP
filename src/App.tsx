import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import {
  QrCode,
  AlertTriangle,
  Database,
  CheckCircle2,
  DollarSign,
  Receipt as ReceiptIcon,
  ShoppingBag,
  ArrowRight,
  RotateCcw,
  Plus,
  Minus,
  X,
  FileSpreadsheet,
  Download,
  UserCheck,
  Calculator,
  Edit2
} from 'lucide-react';

// --- TYPES & INTERFACES ---
export interface Product {
  key?: string; // Natural key dari QR: [produk]__[penitip]
  produk: string;
  penitip: string;
  hargaJual: number;
  hargaTitipEnc?: string;
  hargaTitipDecrypted?: number;
  qty: number;
  initialQty?: number;
}

export function getProductKey(produk: string, penitip: string): string {
  return `${(produk || '').trim().toLowerCase()}__${(penitip || '').trim().toLowerCase()}`;
}

export interface CartItem {
  produk: string;
  penitip?: string;
  hargaJual: number;
  hargaTitip?: number;
  qty: number;
}

export interface Cashier {
  nik: string;
  nama: string;
}

export interface Transaction {
  no: string;
  items: CartItem[];
  total: number;
  pembeli: string;
  petugas?: string;
  timestamp: string;
}

export interface OpnameItem extends Product {
  done: boolean;
  selisih: number;
}

export interface OpnameReturResult {
  produk: string;
  penitip: string;
  jumlahTitipan: number;
  laku: number;
  sisaRetur: number;
  hargaTitip: number;
  uangBayar: number;
}

type Step =
  | 'check_db'
  | 'warning'
  | 'kas_awal'
  | 'main'
  | 'tambah_titipan'
  | 'struk_digital'
  | 'tutup_warning'
  | 'opname_produk'
  | 'hasil_laba'
  | 'opname_kas';

// --- CIPHER ALGORITHM (KDMP Substitution) ---
function getDictionary(a: string, b: string): string[] {
  const cleanA = a.toUpperCase().replace(/[^A-Z]/g, '');
  const cleanB = b.toUpperCase().replace(/[^A-Z]/g, '');
  const setD = Array.from(new Set((cleanA + cleanB).split('')));
  const setE: string[] = [];
  for (let i = 65; i <= 90; i++) {
    const char = String.fromCharCode(i);
    if (!setD.includes(char)) setE.push(char);
  }
  const f: string[] = [];
  const maxLen = Math.max(setD.length, setE.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < setD.length) f.push(setD[i]);
    if (i < setE.length) f.push(setE[i]);
  }
  return f;
}

export function decryptPrice(a: string, b: string, code: string): number {
  if (!code) return 0;
  const f = getDictionary(a, b);
  const mapCharToNum: Record<string, string> = {};
  for (let i = 0; i < f.length; i++) {
    if (i >= 0 && i < 9) mapCharToNum[f[i]] = String(i + 1);
    else if (i === 9) mapCharToNum[f[i]] = '0';
    else if (i === 10) mapCharToNum[f[i]] = ',';
  }
  let numStr = '';
  for (const char of code.toUpperCase()) {
    if (mapCharToNum[char] !== undefined) numStr += mapCharToNum[char];
  }
  numStr = numStr.replace(',', '.');
  const val = parseFloat(numStr);
  return isNaN(val) ? 0 : val * 1000;
}

export function encryptPrice(a: string, b: string, price: number): string {
  const f = getDictionary(a, b);
  const mapNumToChar: Record<string, string> = {};
  for (let i = 0; i < f.length; i++) {
    if (i >= 0 && i < 9) mapNumToChar[String(i + 1)] = f[i];
    else if (i === 9) mapNumToChar['0'] = f[i];
    else if (i === 10) mapNumToChar[','] = f[i];
  }
  const val = (price / 1000).toString().replace('.', ',');
  let codeStr = '';
  for (const char of val) {
    if (mapNumToChar[char] !== undefined) codeStr += mapNumToChar[char];
  }
  return codeStr;
}

// --- INDEXED DB HELPERS (DATA-DRIVEN UNIQUE KEY & TRANSACTION PERSISTENCE) ---
const DB_NAME = 'KDMP_KantinDB';
const STORE_PRODUCTS = 'products';
const STORE_TRANSACTIONS = 'transactions';
const DB_VERSION = 3;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'no' });
      }
    };
  });
}

function fetchAllProducts(db: IDBDatabase): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PRODUCTS, 'readonly');
    const store = tx.objectStore(STORE_PRODUCTS);
    const request = store.getAll();
    request.onsuccess = () => {
      const items = (request.result || []) as Product[];
      const map = new Map<string, Product>();
      items.forEach((p) => {
        const k = p.key || getProductKey(p.produk, p.penitip);
        if (k) {
          map.set(k, { ...p, key: k });
        }
      });
      resolve(Array.from(map.values()));
    };
    request.onerror = () => reject(request.error);
  });
}

function fetchAllTransactions(db: IDBDatabase): Promise<Transaction[]> {
  return new Promise((resolve) => {
    if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
      resolve([]);
      return;
    }
    const tx = db.transaction(STORE_TRANSACTIONS, 'readonly');
    const store = tx.objectStore(STORE_TRANSACTIONS);
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result || []) as Transaction[]);
    request.onerror = () => resolve([]);
  });
}

function saveTransactionToDB(db: IDBDatabase, txData: Transaction): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
      resolve();
      return;
    }
    const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORE_TRANSACTIONS);
    const request = store.put(txData);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function clearAllDatabaseStores(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const storeNames = [STORE_PRODUCTS];
    if (db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
      storeNames.push(STORE_TRANSACTIONS);
    }
    const tx = db.transaction(storeNames, 'readwrite');
    storeNames.forEach((s) => tx.objectStore(s).clear());
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function upsertProductInDB(db: IDBDatabase, product: Product): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTS);
    const k = product.key || getProductKey(product.produk, product.penitip);
    const pWithKey: Product = {
      ...product,
      key: k,
    };
    const request = store.put(pWithKey);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function syncProductsToDB(db: IDBDatabase, products: Product[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTS);
    products.forEach((p) => {
      const k = p.key || getProductKey(p.produk, p.penitip);
      store.put({ ...p, key: k });
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- PDF GENERATION HELPERS (JSPDF) ---
function generateReturPdf(returResults: OpnameReturResult[], petugasNama?: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 10;
  let y = 16;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('KANTIN KDMP SINDUADI', margin, y);

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Sistem Kasir v.01 - Kalurahan Sinduadi', margin, y);

  y += 3.5;
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('LAPORAN OPNAME RETUR & PEMBAYARAN PENITIP', margin, y);

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
  doc.text(`Tanggal / Waktu : ${nowStr}`, margin, y);
  y += 4.5;
  doc.text(`Petugas Kasir   : ${petugasNama || 'Petugas Kasir'}`, margin, y);

  y += 6.5;
  // 9 Kolom:
  // 1: No (7mm) [10, 17]
  // 2: Nama Produk (36mm) [17, 53]
  // 3: Penitip (26mm) [53, 79]
  // 4: Jml Titip (16mm) [79, 95]
  // 5: Laku (13mm) [95, 108]
  // 6: Sisa Retur (17mm) [108, 125]
  // 7: Harga Titip (21mm) [125, 146]
  // 8: Uang Bayar (22mm) [146, 168]
  // 9: Tanda Tangan (22mm) [168, 190]
  const colX = [10, 17, 53, 79, 95, 108, 125, 146, 168, 190];
  const tableWidth = 190;

  // Header Bar
  doc.setFillColor(241, 245, 249); // slate-100
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

  // Tracking subtotal per penitip untuk kemudahan pembayaran
  const rekapPenitip: Record<string, { laku: number; retur: number; bayar: number }> = {};

  returResults.forEach((item, index) => {
    if (y > 255) {
      doc.addPage();
      y = 18;

      // Repeat header on new page
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

    // Rekap per penitip
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
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.rect(margin, y, tableWidth, summaryHeight, 'F');
  doc.setDrawColor(199, 210, 254);
  doc.rect(margin, y, tableWidth, summaryHeight, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138); // blue-900
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

  // Rekapitulasi per Penitip (Memudahkan Penjumlahan & Pembayaran Kasir)
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

interface LabaReportData {
  petugasNama?: string;
  kasAwal: number;
  kasRiil: number;
  catatanSelisih: string;
  totalPenjualan: number;
  totalTransaksi: number;
  labaTotal: number;
  pad20: number;
  kdmp30: number;
  upah50: number;
}

function generateLabaPenutupanPdf(data: LabaReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
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

export default function App() {
  const [dbInstance, setDbInstance] = useState<IDBDatabase | null>(null);
  const [step, setStep] = useState<Step>('check_db');
  const [petugas, setPetugas] = useState<Cashier | null>(null);
  const [kasAwal, setKasAwal] = useState<number>(0);
  const [tempKasAwal, setTempKasAwal] = useState<string>('');
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [customQrInput, setCustomQrInput] = useState<string>('');

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [currentQty, setCurrentQty] = useState<number>(0);

  // Cart & Receipt
  const [receiptCounter, setReceiptCounter] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerInfo, setBuyerInfo] = useState<string>('Umum');
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [receiptDate, setReceiptDate] = useState<string>('');
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);

  // Closing / Opname
  const [opnameList, setOpnameList] = useState<OpnameItem[]>([]);
  const [showDialogSelisih, setShowDialogSelisih] = useState<boolean>(false);
  const [activeSelisihIndex, setActiveSelisihIndex] = useState<number | null>(null);
  const [activeSelisihQty, setActiveSelisihQty] = useState<number>(0);
  const [opnameReturResults, setOpnameReturResults] = useState<OpnameReturResult[]>([]);
  const [kasRiil, setKasRiil] = useState<string>('');
  const [catatanSelisihKas, setCatatanSelisihKas] = useState<string>('');

  // Helper Sample QR strings
  const sampleProducts = useMemo(() => {
    const p1 = 'Keripik Singkong';
    const pen1 = 'Ibu Ani';
    const jual1 = 10000;
    const enc1 = encryptPrice(p1, pen1, 8000);

    const p2 = 'Kue Lapis';
    const pen2 = 'Pak Joko';
    const jual2 = 5000;
    const enc2 = encryptPrice(p2, pen2, 4000);

    return [
      `${p1},${pen1},${jual1},${enc1}`,
      `${p2},${pen2},${jual2},${enc2}`,
    ];
  }, []);

  // Initialize DB on Mount
  useEffect(() => {
    openDatabase()
      .then(async (db) => {
        setDbInstance(db);
        const [storedProducts, storedTransactions] = await Promise.all([
          fetchAllProducts(db),
          fetchAllTransactions(db),
        ]);
        setProducts(storedProducts);
        setTransactionHistory(storedTransactions);
        if (storedTransactions.length > 0) {
          setReceiptCounter(storedTransactions.length + 1);
        }
        if (storedProducts.length > 0 || storedTransactions.length > 0) {
          setStep('check_db');
        } else {
          setStep('warning');
          setReceiptCounter(1);
        }
      })
      .catch((err) => {
        console.error('Gagal membuka IndexedDB:', err);
        setStep('warning');
      });
  }, []);

  // Update receipt date/time string
  const updateDateTime = useCallback(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    setReceiptDate(`${hours}:${minutes}, ${day}/${month}/${year}`);
  }, []);

  const receiptNumber = useMemo(() => {
    return String(receiptCounter).padStart(3, '0');
  }, [receiptCounter]);

  const totalCartAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty * item.hargaJual, 0);
  }, [cart]);

  // Total Laba Kantin (Kantin KDMP margin calculation)
  const totalLabaKantin = useMemo(() => {
    // Menghitung akumulasi laba bersih dari seluruh transaksi yang lunas
    const labaTransaksi = transactionHistory.reduce((sum, tx) => {
      const marginTx = tx.items.reduce((itemSum, item) => {
        const hBeli = item.hargaTitip || item.hargaJual * 0.8;
        return itemSum + (item.hargaJual - hBeli) * item.qty;
      }, 0);
      return sum + marginTx;
    }, 0);
    return Math.max(labaTransaksi, 0);
  }, [transactionHistory]);

  const totalKasSistem = useMemo(() => {
    const totalPenjualan = transactionHistory.reduce((sum, tx) => sum + tx.total, 0);
    return Number(kasAwal || 0) + totalPenjualan;
  }, [transactionHistory, kasAwal]);

  // Database actions
  const handleContinueDatabase = () => {
    setStep('warning');
  };

  const handleResetDatabase = async () => {
    if (dbInstance) {
      await clearAllDatabaseStores(dbInstance);
    }
    setProducts([]);
    setReceiptCounter(1);
    setTransactionHistory([]);
    setStep('warning');
  };

  // Tutup Kasir trigger & confirmation
  const pemicuTutupKasir = () => {
    setStep('tutup_warning');
  };

  const confirmTutupKasir = useCallback(() => {
    const list: OpnameItem[] = products.map((p) => ({
      ...p,
      done: false,
      selisih: 0,
    }));
    setOpnameList(list);
    setStep('opname_produk');
  }, [products]);

  // Opname Handlers
  const bukaDialogSelisih = (index: number) => {
    setActiveSelisihIndex(index);
    setActiveSelisihQty(0);
    setShowDialogSelisih(true);
  };

  const simpanSelisih = () => {
    if (activeSelisihIndex !== null) {
      setOpnameList((prev) => {
        const copy = [...prev];
        copy[activeSelisihIndex] = {
          ...copy[activeSelisihIndex],
          selisih: activeSelisihQty,
          done: true,
        };
        return copy;
      });
    }
    setShowDialogSelisih(false);
    setActiveSelisihIndex(null);
  };

  const selesaiItemOpname = (index: number) => {
    setOpnameList((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        selisih: 0,
        done: true,
      };
      return copy;
    });
  };

  const selesaiOpnameProduk = () => {
    const finalizedList = opnameList.map((item) => ({ ...item, done: true }));
    setOpnameList(finalizedList);

    // Hitung penjualan (laku) dari transactionHistory untuk setiap produk titipan
    const returResults: OpnameReturResult[] = finalizedList.map((item) => {
      const pKey = item.key || getProductKey(item.produk, item.penitip);

      // Total pcs yang terjual di seluruh transaksi lunas
      const totalLaku = transactionHistory.reduce((sum, tx) => {
        const itemSold = tx.items.find(
          (ti) =>
            (ti.penitip ? getProductKey(ti.produk, ti.penitip) === pKey : false) ||
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
        decryptPrice(item.produk, item.penitip, item.hargaTitipEnc || '') ||
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
      const pComp = a.penitip.localeCompare(b.penitip, 'id-ID', { sensitivity: 'base' });
      if (pComp !== 0) return pComp;
      return a.produk.localeCompare(b.produk, 'id-ID', { sensitivity: 'base' });
    });

    setOpnameReturResults(returResults);

    // Ekspor PDF Laporan Retur & Pembayaran Penitip
    generateReturPdf(returResults, petugas?.nama);

    setStep('hasil_laba');
  };

  const lanjutKeOpnameKas = () => {
    // Default sesuai kas tercatat sistem
    setKasRiil(String(totalKasSistem));
    setStep('opname_kas');
  };

  const prosesPenutupanFinal = async () => {
    const labaTotal = totalLabaKantin;
    const pad20 = Math.round(labaTotal * 0.2);
    const kdmp30 = Math.round(labaTotal * 0.3);
    const upah50 = Math.round(labaTotal * 0.5);
    const totalPenjualan = transactionHistory.reduce((sum, tx) => sum + tx.total, 0);

    const nominalKasRiil = kasRiil.trim() === '' ? totalKasSistem : Number(kasRiil);

    // Ekspor PDF Laporan Penutupan Kasir & Pembagian Laba
    generateLabaPenutupanPdf({
      petugasNama: petugas?.nama,
      kasAwal: Number(kasAwal || 0),
      kasRiil: isNaN(nominalKasRiil) ? totalKasSistem : nominalKasRiil,
      catatanSelisih: catatanSelisihKas,
      totalPenjualan,
      totalTransaksi: transactionHistory.length,
      labaTotal,
      pad20,
      kdmp30,
      upah50,
    });

    // JSON Backup (tetap dipertahankan untuk internal database)
    const dbBackup = {
      petugas,
      kasAwal,
      kasRiil: isNaN(nominalKasRiil) ? totalKasSistem : nominalKasRiil,
      catatanSelisihKas,
      riwayatTransaksi: transactionHistory,
      dataOpnameRetur: opnameReturResults,
      pembagianLaba: {
        labaTotal,
        pad20,
        kdmp30,
        upah50,
      },
      timestamp: new Date().toISOString(),
    };
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dbBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `database_kantin_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    // Reset DB
    if (dbInstance) {
      await clearAllDatabaseStores(dbInstance);
    }

    setProducts([]);
    setPetugas(null);
    setKasAwal(0);
    setTempKasAwal('');
    setCart([]);
    setTransactionHistory([]);
    setReceiptCounter(1);
    setStep('warning');
  };

  // Edit Qty Manual in Main Table
  const editQtyManual = async (index: number) => {
    const item = products[index];
    const newQtyStr = prompt(
      `Ubah jumlah produk "${item.produk}" (${item.penitip}):`,
      String(item.qty)
    );
    if (newQtyStr !== null && !isNaN(Number(newQtyStr))) {
      const updatedQty = Math.max(0, parseInt(newQtyStr, 10));
      const k = item.key || getProductKey(item.produk, item.penitip);
      const updatedItem: Product = { ...item, key: k, qty: updatedQty };
      const updatedProducts = [...products];
      updatedProducts[index] = updatedItem;
      setProducts(updatedProducts);

      if (dbInstance) {
        await upsertProductInDB(dbInstance, updatedItem);
      }
    }
  };

  // CORE QR HANDLER
  const handleQR = async (rawCode: string) => {
    setShowSimModal(false);
    const data = rawCode.trim();
    const parts = data.split(',');

    // 1. PRIORITAS UTAMA: Cek jika input adalah QR Produk (min 4 bagian: Produk, Penitip, HargaJual, KodeEnkripsi)
    if (parts.length >= 4 && !isNaN(Number(parts[2].trim()))) {
      const produk = parts[0].trim();
      const penitip = parts[1].trim();
      const hargaJual = Number(parts[2].trim());
      const encCode = parts[3].trim();
      const hargaTitipDecrypted = decryptPrice(produk, penitip, encCode);
      const productKey = getProductKey(produk, penitip);

      if (step === 'main') {
        const existingIndex = products.findIndex(
          (p) => (p.key || getProductKey(p.produk, p.penitip)) === productKey
        );

        if (existingIndex === -1 || products[existingIndex].qty <= 0) {
          setCurrentProduct({
            key: productKey,
            produk,
            penitip,
            hargaJual,
            hargaTitipDecrypted,
            hargaTitipEnc: encCode,
          });
          setCurrentQty(0);
          setStep('tambah_titipan');
        } else {
          // Buka struk digital & kurangi 1 stok
          updateDateTime();
          const existing = products[existingIndex];
          if (existing.qty > 0) {
            const updatedProducts = [...products];
            const updatedItem: Product = {
              ...existing,
              key: productKey,
              qty: existing.qty - 1,
            };
            updatedProducts[existingIndex] = updatedItem;
            setProducts(updatedProducts);

            if (dbInstance) {
              await upsertProductInDB(dbInstance, updatedItem);
            }

            setCart([
              {
                produk,
                penitip,
                hargaJual,
                hargaTitip: existing.hargaTitipDecrypted || hargaTitipDecrypted,
                qty: 1,
              },
            ]);
            setIsPaid(false);
            setStep('struk_digital');
          }
        }
      } else if (step === 'struk_digital') {
        const existingIndex = products.findIndex(
          (p) => (p.key || getProductKey(p.produk, p.penitip)) === productKey
        );

        if (existingIndex !== -1 && products[existingIndex].qty > 0) {
          const existing = products[existingIndex];
          const updatedProducts = [...products];
          const updatedItem: Product = {
            ...existing,
            key: productKey,
            qty: existing.qty - 1,
          };
          updatedProducts[existingIndex] = updatedItem;
          setProducts(updatedProducts);

          if (dbInstance) {
            await upsertProductInDB(dbInstance, updatedItem);
          }

          setCart((prevCart) => {
            const itemIndex = prevCart.findIndex(
              (item) =>
                (item.penitip
                  ? getProductKey(item.produk, item.penitip) === productKey
                  : item.produk.toLowerCase() === produk.toLowerCase())
            );
            if (itemIndex !== -1) {
              const copy = [...prevCart];
              copy[itemIndex] = { ...copy[itemIndex], qty: copy[itemIndex].qty + 1 };
              return copy;
            } else {
              return [
                ...prevCart,
                {
                  produk,
                  penitip,
                  hargaJual,
                  hargaTitip: existing.hargaTitipDecrypted || hargaTitipDecrypted,
                  qty: 1,
                },
              ];
            }
          });
        }
      }
      return;
    }

    // 2. CEK QR ID PETUGAS (NIK 16 digit, Nama)
    if (parts.length >= 2 && parts[0].trim().length === 16 && isNaN(Number(parts[1].trim()))) {
      const scannedNik = parts[0].trim();
      const scannedNama = parts[1].trim();

      // Pemicu tutup kasir dari main
      if (step === 'main') {
        if (petugas && petugas.nik === scannedNik) {
          setStep('tutup_warning');
        }
        return;
      }

      // Konfirmasi penutupan kasir
      if (step === 'tutup_warning') {
        if (petugas && petugas.nik === scannedNik) {
          confirmTutupKasir();
        } else {
          setStep('main');
        }
        return;
      }

      // Login petugas pada tahap warning awal
      if (step === 'warning') {
        setPetugas({ nik: scannedNik, nama: scannedNama });
        setStep('kas_awal');
        return;
      }

      // Identitas pembeli pada saat struk_digital aktif
      if (step === 'struk_digital') {
        setBuyerInfo(scannedNama);
        return;
      }
    }

    // 3. STEP KAS AWAL -> 'OK'
    if (step === 'kas_awal') {
      if (data === 'OK') {
        const nominal = tempKasAwal.trim() === '' ? 0 : Number(tempKasAwal);
        setKasAwal(isNaN(nominal) ? 0 : Math.max(0, nominal));
        setStep('main');
      }
      return;
    }

    // 4. STEP TAMBAH TITIPAN -> QTY CONTROLS
    if (step === 'tambah_titipan') {
      if (data === '>') setCurrentQty((q) => q + 1);
      else if (data === '<') setCurrentQty((q) => Math.max(0, q - 1));
      else if (data === '^') setCurrentQty((q) => q + 5);
      else if (data === '!') setCurrentQty((q) => Math.max(0, q - 5));
      else if (data === 'OK') {
        if (currentQty > 0 && currentProduct.produk && currentProduct.penitip) {
          const k = currentProduct.key || getProductKey(currentProduct.produk, currentProduct.penitip);

          const existingIdx = products.findIndex(
            (p) => (p.key || getProductKey(p.produk, p.penitip)) === k
          );

          const prevInitialQty = existingIdx !== -1 ? products[existingIdx].initialQty : undefined;
          const newProduct: Product = {
            key: k,
            produk: currentProduct.produk,
            penitip: currentProduct.penitip,
            hargaJual: Number(currentProduct.hargaJual),
            hargaTitipEnc: currentProduct.hargaTitipEnc,
            hargaTitipDecrypted: currentProduct.hargaTitipDecrypted,
            qty: currentQty,
            initialQty: prevInitialQty !== undefined ? prevInitialQty + currentQty : currentQty,
          };

          let updatedProducts: Product[];
          if (existingIdx !== -1) {
            updatedProducts = [...products];
            updatedProducts[existingIdx] = newProduct;
          } else {
            updatedProducts = [...products, newProduct];
          }

          setProducts(updatedProducts);
          if (dbInstance) {
            await upsertProductInDB(dbInstance, newProduct);
          }
        }
        setStep('main');
      }
      return;
    }

    // 5. STEP STRUK DIGITAL -> TRANSAKSI
    if (step === 'struk_digital') {
      // Jika status LUNAS, scan apapun selanjutnya akan menutup struk dan reset untuk transaksi baru
      if (isPaid) {
        setIsPaid(false);
        setCart([]);
        setBuyerInfo('Umum');
        setReceiptCounter((c) => c + 1);
        setStep('main');
        return;
      }

      // Tambah item terakhir: '>'
      if (data === '>') {
        if (cart.length > 0) {
          const lastItem = cart[cart.length - 1];
          const k = getProductKey(lastItem.produk, lastItem.penitip || '');
          const dbIndex = products.findIndex(
            (p) =>
              (p.key || getProductKey(p.produk, p.penitip)) === k ||
              p.produk.toLowerCase() === lastItem.produk.toLowerCase()
          );
          if (dbIndex !== -1 && products[dbIndex].qty > 0) {
            const updatedProducts = [...products];
            const updatedItem: Product = {
              ...updatedProducts[dbIndex],
              qty: updatedProducts[dbIndex].qty - 1,
            };
            updatedProducts[dbIndex] = updatedItem;
            setProducts(updatedProducts);
            if (dbInstance) {
              await upsertProductInDB(dbInstance, updatedItem);
            }

            setCart((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = {
                ...copy[copy.length - 1],
                qty: copy[copy.length - 1].qty + 1,
              };
              return copy;
            });
          }
        }
        return;
      }

      // Kurang item terakhir: '<'
      if (data === '<') {
        if (cart.length > 0) {
          const lastIndex = cart.length - 1;
          const lastItem = cart[lastIndex];
          const k = getProductKey(lastItem.produk, lastItem.penitip || '');
          const dbIndex = products.findIndex(
            (p) =>
              (p.key || getProductKey(p.produk, p.penitip)) === k ||
              p.produk.toLowerCase() === lastItem.produk.toLowerCase()
          );

          if (dbIndex !== -1) {
            const updatedProducts = [...products];
            const updatedItem: Product = {
              ...updatedProducts[dbIndex],
              qty: updatedProducts[dbIndex].qty + 1,
            };
            updatedProducts[dbIndex] = updatedItem;
            setProducts(updatedProducts);
            if (dbInstance) {
              await upsertProductInDB(dbInstance, updatedItem);
            }
          }

          if (lastItem.qty > 1) {
            setCart((prev) => {
              const copy = [...prev];
              copy[lastIndex] = { ...copy[lastIndex], qty: copy[lastIndex].qty - 1 };
              return copy;
            });
          } else {
            const newCart = cart.slice(0, lastIndex);
            setCart(newCart);
            if (newCart.length === 0) {
              setStep('main');
            }
          }
        }
        return;
      }

      // Batal seluruh transaksi: '^'
      if (data === '^') {
        // Kembalikan semua stok barang ke list & DB
        const restoredProducts = [...products];
        for (const item of cart) {
          const k = getProductKey(item.produk, item.penitip || '');
          const dbIdx = restoredProducts.findIndex(
            (p) =>
              (p.key || getProductKey(p.produk, p.penitip)) === k ||
              p.produk.toLowerCase() === item.produk.toLowerCase()
          );
          if (dbIdx !== -1) {
            restoredProducts[dbIdx] = {
              ...restoredProducts[dbIdx],
              qty: restoredProducts[dbIdx].qty + item.qty,
            };
          }
        }
        setProducts(restoredProducts);
        if (dbInstance) {
          await syncProductsToDB(dbInstance, restoredProducts);
        }

        setCart([]);
        setBuyerInfo('Umum');
        setStep('main');
        return;
      }

      // Pelunasan: 'OK'
      if (data === 'OK') {
        setIsPaid(true);
        if (cart.length > 0) {
          const settledTx: Transaction = {
            no: receiptNumber,
            items: [...cart],
            total: totalCartAmount,
            pembeli: buyerInfo,
            petugas: petugas?.nama,
            timestamp: receiptDate,
          };
          setTransactionHistory((prev) => {
            const exists = prev.some((t) => t.no === settledTx.no);
            return exists ? prev : [...prev, settledTx];
          });
          if (dbInstance) {
            await saveTransactionToDB(dbInstance, settledTx);
          }
        }
        return;
      }
    }
  };

  const handleQRRef = React.useRef(handleQR);
  useEffect(() => {
    handleQRRef.current = handleQR;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      if (isInput) {
        if (e.key === 'Enter' && step === 'kas_awal') {
          e.preventDefault();
          handleQRRef.current('OK');
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handleQRRef.current('<');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleQRRef.current('>');
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleQRRef.current('^');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleQRRef.current('!');
          break;
        case 'Enter':
          e.preventDefault();
          handleQRRef.current('OK');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [step, tempKasAwal]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* 0. MODAL: DATABASE DITEMUKAN */}
      {step === 'check_db' && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Database Ditemukan</h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Terdapat data produk tersimpan sebelumnya di penyimpanan lokal. Apakah Anda ingin
                meneruskan data yang ada atau mereset database dari awal?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleContinueDatabase}
                className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-sm transition flex items-center justify-center gap-1.5"
              >
                Meneruskan
              </button>
              <button
                onClick={handleResetDatabase}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-1.5"
              >
                Reset dari Awal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. MODAL: PERINGATAN SEBELUM MEMULAI */}
      {step === 'warning' && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Perhatian Sebelum Memulai</h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Silakan cek kondisi baterai ponsel, persiapkan charger atau power bank, cek memori
                HP, sebelum melanjutkan. Aplikasi hanya bisa dilanjutkan dengan scan QR ID petugas.
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs text-left leading-relaxed">
              💡 Gunakan tombol <strong>Simulasi QR</strong> di pojok kanan bawah atau tombol di bawah ini untuk scan QR ID Petugas.
            </div>

            <button
              onClick={() => setShowSimModal(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-blue-200 active:scale-98"
            >
              <QrCode className="w-5 h-5" />
              Buka Simulasi Scan QR Petugas
            </button>
          </div>
        </div>
      )}

      {/* 2. MODAL: KAS AWAL */}
      {step === 'kas_awal' && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pengisian Kas Awal</h2>
                <p className="text-slate-500 text-xs">Petugas: {petugas?.nama}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Kas Pagi (Uang Kembalian)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  value={tempKasAwal}
                  onChange={(e) => setTempKasAwal(e.target.value)}
                  placeholder="0"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden text-lg font-bold text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Default: Rp 0 bila dikosongkan.
              </p>
            </div>

            <button
              onClick={() => handleQR('OK')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-200 active:scale-98"
            >
              <CheckCircle2 className="w-5 h-5" />
              Simpan Kas Awal (Scan QR &quot;OK&quot;)
            </button>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs">
              💡 Atau gunakan tombol simulasi QR di pojok kanan bawah dan pilih <strong>&quot;OK&quot;</strong>.
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL: TAMBAH TITIPAN (PRODUK BARU) */}
      {step === 'tambah_titipan' && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                Tambah Titipan Produk Baru
              </h2>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Produk:</span>
                <strong className="text-slate-800">{currentProduct.produk}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penitip:</span>
                <strong className="text-slate-800">{currentProduct.penitip}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Harga Jual:</span>
                <strong className="text-slate-900">
                  Rp {Number(currentProduct.hargaJual || 0).toLocaleString('id-ID')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Harga Titip (Dekripsi):</span>
                <strong className="text-emerald-600">
                  Rp {Number(currentProduct.hargaTitipDecrypted || 0).toLocaleString('id-ID')}
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 text-center">
                Jumlah Stok Produk
              </label>
              <div className="text-4xl font-extrabold text-blue-600 text-center py-4 bg-blue-50 border border-blue-100 rounded-2xl">
                {currentQty}
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Gunakan scan QR kontrol <strong>&lt;</strong>, <strong>&gt;</strong>,{' '}
              <strong>^</strong> (+5), <strong>!</strong> (-5) untuk ubah qty, dan{' '}
              <strong>&quot;OK&quot;</strong> untuk menyimpan.
            </p>
          </div>
        </div>
      )}

      {/* 4. MODAL: STRUK DIGITAL */}
      {step === 'struk_digital' && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {isPaid && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="text-6xl font-black text-rose-500/25 tracking-widest border-8 border-rose-500/30 px-6 py-2 rounded-2xl -rotate-12 select-none">
                  LUNAS
                </span>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl font-mono text-xs space-y-3 border border-slate-200">
              <div className="text-center">
                <div className="font-bold text-sm tracking-wide text-slate-900">
                  KANTIN KDMP SINDUADI
                </div>
                <div className="text-[10px] text-slate-500">Kantin Kejujuran Kalurahan Sinduadi</div>
              </div>
              <div className="flex justify-between border-y border-dashed border-slate-300 py-1.5">
                <span>
                  No. <strong>{receiptNumber}</strong>
                </span>
                <span>{receiptDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Pembeli:</span>
                <strong className="text-slate-800">{buyerInfo}</strong>
              </div>
              <div className="border-b border-dashed border-slate-300"></div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.qty}x {item.produk}
                    </span>
                    <span>Rp {(item.qty * item.hargaJual).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Pembelian:</span>
                <span className="text-blue-700">Rp {totalCartAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-slate-500 text-[11px] pt-1">
                Petugas Kasir: <span className="font-semibold text-slate-700">{petugas?.nama}</span>
              </div>
            </div>

            <div className="text-xs text-center text-slate-600 leading-relaxed">
              {!isPaid ? (
                <span>
                  Scan QR produk lain untuk tambah/ubah qty. Scan ID Anggota, atau QR{' '}
                  <strong>&quot;OK&quot;</strong> untuk melunasi.
                </span>
              ) : (
                <span className="font-bold text-emerald-600 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4 inline" />
                  Transaksi Lunas! Scan QR selanjutnya untuk memulai transaksi baru.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAHAP 3: MODAL PERINGATAN TUTUP KASIR */}
      {step === 'tutup_warning' && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Konfirmasi Penutupan</h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                KASIR AKAN DITUTUP. SCAN QR ID PETUGAS ({petugas?.nama}) UNTUK MELANJUTKAN.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setStep('main')}
                className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-sm transition"
              >
                Batal / Kembali
              </button>
              <button
                onClick={confirmTutupKasir}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-1.5"
              >
                Konfirmasi Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAHAP 3: OPNAME PRODUK */}
      {step === 'opname_produk' && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Opname Stok Produk</h2>
                <p className="text-xs text-slate-500">
                  Verifikasi stok sisa fisik di etalase dan tentukan selisih jika ada.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Produk</th>
                    <th className="p-3">Penitip</th>
                    <th className="p-3 text-center">Stok Sistem</th>
                    <th className="p-3 text-center">Status / Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opnameList.map((item, idx) => (
                    <tr
                      key={idx}
                      className={item.done ? 'bg-emerald-50/60 text-slate-600' : 'hover:bg-slate-50'}
                    >
                      <td className="p-3 font-medium text-slate-900">{item.produk}</td>
                      <td className="p-3 text-slate-600">{item.penitip}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{item.qty}</td>
                      <td className="p-3 text-center">
                        {!item.done ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => bukaDialogSelisih(idx)}
                              className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-lg text-xs transition"
                            >
                              Selisih
                            </button>
                            <button
                              onClick={() => selesaiItemOpname(idx)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition"
                            >
                              Sesuai
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                            Selesai {item.selisih !== 0 && `(Selisih: ${item.selisih})`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {opnameList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        Tidak ada produk dalam daftar opname.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={selesaiOpnameProduk}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Selesai Opname & Download Laporan Retur (PDF)
            </button>
          </div>
        </div>
      )}

      {/* DIALOG INPUT SELISIH */}
      {showDialogSelisih && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900">Input Selisih Stok</h3>
            <p className="text-xs text-slate-500">
              (- menandakan stok kurang/rusak, + menandakan stok berlebih)
            </p>
            <div className="flex items-center justify-center space-x-5 py-2">
              <button
                onClick={() => setActiveSelisihQty((q) => q - 1)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xl font-bold transition flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-3xl font-extrabold text-blue-600 w-16 text-center">
                {activeSelisihQty > 0 ? `+${activeSelisihQty}` : activeSelisihQty}
              </span>
              <button
                onClick={() => setActiveSelisihQty((q) => q + 1)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xl font-bold transition flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={simpanSelisih}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition"
            >
              Simpan Selisih
            </button>
          </div>
        </div>
      )}

      {/* 7. TAHAP 3: HASIL PERHITUNGAN LABA */}
      {step === 'hasil_laba' && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Hasil Perhitungan Laba</h2>
                <p className="text-xs text-slate-500">Pembagian laba usaha kantin sesuai proporsi</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 font-mono text-sm">
              <div className="flex justify-between text-slate-900 font-bold border-b border-slate-200 pb-2">
                <span>Laba Total Kantin:</span>
                <span className="text-emerald-700">
                  Rp {totalLabaKantin.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-blue-800">
                <span>20% PAD (Pendapatan Desa):</span>
                <strong>Rp {Math.round(totalLabaKantin * 0.2).toLocaleString('id-ID')}</strong>
              </div>
              <div className="flex justify-between text-indigo-800">
                <span>30% KDMP Sinduadi:</span>
                <strong>Rp {Math.round(totalLabaKantin * 0.3).toLocaleString('id-ID')}</strong>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>50% Upah Operasional:</span>
                <strong>Rp {Math.round(totalLabaKantin * 0.5).toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <button
              onClick={lanjutKeOpnameKas}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              Lanjutkan ke Opname Kas
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 8. TAHAP 3: OPNAME KAS & PENUTUPAN FINAL */}
      {step === 'opname_kas' && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900">Opname Kas Akhir</h2>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Kas Awal:</span>
                <strong className="text-slate-800">
                  Rp {Number(kasAwal).toLocaleString('id-ID')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kas Tercatat Sistem (Cash Masuk):</span>
                <strong className="text-blue-700">
                  Rp {totalKasSistem.toLocaleString('id-ID')}
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Kas Riil di Laci Kasir
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  value={kasRiil}
                  onFocus={() => {
                    // Ketika diketuk pada input kas riil, langsung kosong
                    setKasRiil('');
                  }}
                  onChange={(e) => setKasRiil(e.target.value)}
                  onBlur={() => {
                    // Jika tidak diketuk atau dibiarkan kosong, kembalikan ke default
                    if (kasRiil.trim() === '') {
                      setKasRiil(String(totalKasSistem));
                    }
                  }}
                  placeholder={String(totalKasSistem)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden text-lg font-bold text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Default: Rp {totalKasSistem.toLocaleString('id-ID')} (sesuai kas sistem). Ketuk untuk mengosongkan jika kas fisik berbeda.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Catatan Selisih (Opsional)
              </label>
              <input
                type="text"
                value={catatanSelisihKas}
                onChange={(e) => setCatatanSelisihKas(e.target.value)}
                placeholder="Alasan selisih kas bila ada..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden text-sm text-slate-800"
              />
            </div>

            <button
              onClick={prosesPenutupanFinal}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-rose-200"
            >
              PROSES PENUTUPAN & DOWNLOAD LAPORAN (PDF)
            </button>
          </div>
        </div>
      )}

      {/* HEADER UTAMA */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              KD
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 tracking-tight leading-none">
                KANTIN KDMP SINDUADI
              </h1>
              <span className="text-[11px] text-slate-500 font-medium">
                Sistem Kasir v.01
              </span>
            </div>
          </div>

          {petugas && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex flex-col text-right">
                <span className="text-slate-400 text-[10px]">Petugas Aktif</span>
                <strong className="text-slate-800">{petugas.nama}</strong>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-5">

        {/* Tabel Produk Titipan */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Daftar Produk Titipan</h3>
              <p className="text-xs text-slate-500">Stok barang yang tersedia di etalase</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              {products.length} item terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs">
                  <th className="p-3.5 font-semibold text-center w-24">Jumlah</th>
                  <th className="p-3.5 font-semibold">Produk</th>
                  <th className="p-3.5 font-semibold">Penitip</th>
                  <th className="p-3.5 font-semibold text-right">Harga Jual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => editQtyManual(index)}
                        title="Klik untuk ubah stok manual"
                        className="inline-flex items-center gap-1 font-bold text-blue-600 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs transition"
                      >
                        <span>{item.qty}</span>
                        <Edit2 className="w-3 h-3 text-blue-400" />
                      </button>
                    </td>
                    <td className="p-3.5 text-slate-900 font-medium">{item.produk}</td>
                    <td className="p-3.5 text-slate-600">{item.penitip}</td>
                    <td className="p-3.5 text-slate-900 font-semibold text-right">
                      Rp {Number(item.hargaJual).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                        <p className="text-sm">Belum ada produk tersimpan.</p>
                        <p className="text-xs text-slate-400">
                          Buka tombol simulasi kamera di pojok kanan bawah untuk scan QR Produk.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* FLOATING BUTTON (QR SIMULATOR) */}
      <div className="fixed bottom-6 right-6 z-70 pointer-events-auto">
        <button
          onClick={() => setShowSimModal(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center transition-all transform active:scale-95 focus:outline-hidden focus:ring-4 focus:ring-blue-300 relative group"
          title="Buka Scanner QR / Simulator"
        >
          <QrCode className="w-7 h-7" />
          <span className="sr-only">Buka Scanner QR</span>
          {step === 'warning' && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white"></span>
            </span>
          )}
        </button>
      </div>

      {/* MODAL SIMULASI SCAN QR */}
      {showSimModal && (
        <div className="fixed inset-0 z-80 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Simulasi Input Scan QR</h3>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* 1. Tombol Kecil: produk 1, produk 2, petugas, pembeli */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Simulasi Scan QR
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleQR(sampleProducts[0])}
                    className="px-2 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition text-center truncate active:scale-95"
                    title={sampleProducts[0]}
                  >
                    produk 1
                  </button>
                  <button
                    onClick={() => handleQR(sampleProducts[1])}
                    className="px-2 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition text-center truncate active:scale-95"
                    title={sampleProducts[1]}
                  >
                    produk 2
                  </button>
                  <button
                    onClick={() => handleQR('3404123456789012,Budi Santoso')}
                    className="px-2 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition text-center truncate active:scale-95"
                    title="3404123456789012,Budi Santoso"
                  >
                    petugas
                  </button>
                  <button
                    onClick={() => handleQR('3404987654321098,Siti Aminah')}
                    className="px-2 py-2 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl transition text-center truncate active:scale-95"
                    title="3404987654321098,Siti Aminah"
                  >
                    pembeli
                  </button>
                </div>
              </div>

              {/* 2. Susunan Karakter Kontrol:
                   - di tengah-tengah "OK"
                   - di sebelah kiri "<"
                   - di sebelah kanan ">"
                   - di bawah "!"
                   - di atas "^"
              */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center">
                  Karakter Kontrol
                </span>
                <div className="flex flex-col items-center justify-center py-1">
                  {/* Di atas: ^ */}
                  <button
                    onClick={() => handleQR('^')}
                    className="w-16 h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base rounded-xl transition flex flex-col items-center justify-center shadow-xs active:scale-95"
                    title="^ (+5 / Batal)"
                  >
                    <span>^</span>
                    <span className="text-[9px] text-slate-400 font-normal leading-none">+5 / Batal</span>
                  </button>

                  {/* Di tengah: < | OK | > */}
                  <div className="flex items-center gap-3 my-2">
                    <button
                      onClick={() => handleQR('<')}
                      className="w-16 h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base rounded-xl transition flex flex-col items-center justify-center shadow-xs active:scale-95"
                      title="< (Kurang)"
                    >
                      <span>&lt;</span>
                      <span className="text-[9px] text-slate-400 font-normal leading-none">Kurang</span>
                    </button>

                    <button
                      onClick={() => handleQR('OK')}
                      className="w-24 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-xl transition flex flex-col items-center justify-center shadow-md shadow-emerald-200 active:scale-95"
                      title="OK (Simpan / Lunas)"
                    >
                      <span>OK</span>
                      <span className="text-[9px] text-emerald-100 font-normal leading-none">Simpan / Lunas</span>
                    </button>

                    <button
                      onClick={() => handleQR('>')}
                      className="w-16 h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base rounded-xl transition flex flex-col items-center justify-center shadow-xs active:scale-95"
                      title="> (Tambah)"
                    >
                      <span>&gt;</span>
                      <span className="text-[9px] text-slate-400 font-normal leading-none">Tambah</span>
                    </button>
                  </div>

                  {/* Di bawah: ! */}
                  <button
                    onClick={() => handleQR('!')}
                    className="w-16 h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base rounded-xl transition flex flex-col items-center justify-center shadow-xs active:scale-95"
                    title="! (-5)"
                  >
                    <span>!</span>
                    <span className="text-[9px] text-slate-400 font-normal leading-none">-5</span>
                  </button>
                </div>
              </div>

              {/* 3. Paling Bawah: Input Ketik Kode QR */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Ketik Kode QR:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customQrInput}
                    onChange={(e) => setCustomQrInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customQrInput.trim()) {
                        handleQR(customQrInput.trim());
                        setCustomQrInput('');
                      }
                    }}
                    placeholder="Ketik kode QR bebas..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                  <button
                    onClick={() => {
                      if (customQrInput.trim()) {
                        handleQR(customQrInput.trim());
                        setCustomQrInput('');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition active:scale-95"
                  >
                    Kirim
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
