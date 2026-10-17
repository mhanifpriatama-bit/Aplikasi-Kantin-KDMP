/**
 * Kantin KDMP Sinduadi - Modul Cipher Substitusi KDMP
 * Algoritma enkripsi dan dekripsi harga titip pada barcode QR
 */

(function () {
  'use strict';

  function getDictionary(a, b) {
    const cleanA = (a || '').toUpperCase().replace(/[^A-Z]/g, '');
    const cleanB = (b || '').toUpperCase().replace(/[^A-Z]/g, '');
    const setD = Array.from(new Set((cleanA + cleanB).split('')));
    const setE = [];
    for (let i = 65; i <= 90; i++) {
      const char = String.fromCharCode(i);
      if (!setD.includes(char)) setE.push(char);
    }
    const f = [];
    const maxLen = Math.max(setD.length, setE.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < setD.length) f.push(setD[i]);
      if (i < setE.length) f.push(setE[i]);
    }
    return f;
  }

  function decryptPrice(a, b, code) {
    if (!code) return 0;
    const f = getDictionary(a, b);
    const mapCharToNum = {};
    for (let i = 0; i < f.length; i++) {
      if (i >= 0 && i < 9) mapCharToNum[f[i]] = String(i + 1);
      else if (i === 9) mapCharToNum[f[i]] = '0';
      else if (i === 10) mapCharToNum[f[i]] = ',';
    }
    let numStr = '';
    for (const char of String(code).toUpperCase()) {
      if (mapCharToNum[char] !== undefined) numStr += mapCharToNum[char];
    }
    numStr = numStr.replace(',', '.');
    const val = parseFloat(numStr);
    return isNaN(val) ? 0 : val * 1000;
  }

  function encryptPrice(a, b, price) {
    const f = getDictionary(a, b);
    const mapNumToChar = {};
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

  function getProductKey(produk, penitip) {
    return `${(produk || '').trim().toLowerCase()}__${(penitip || '').trim().toLowerCase()}`;
  }

  // Export to global scope & namespace
  window.KDMPCipher = {
    getDictionary,
    decryptPrice,
    encryptPrice,
    getProductKey
  };

  window.getDictionary = getDictionary;
  window.decryptPrice = decryptPrice;
  window.encryptPrice = encryptPrice;
  window.getProductKey = getProductKey;
})();
