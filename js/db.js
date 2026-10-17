/**
 * Kantin KDMP Sinduadi - Modul Database IndexedDB
 * Pengelolaan penyimpanan lokal permanen untuk produk dan riwayat transaksi
 */

(function () {
  'use strict';

  const DB_NAME = 'KDMP_KantinDB';
  const STORE_PRODUCTS = 'products';
  const STORE_TRANSACTIONS = 'transactions';
  const DB_VERSION = 3;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB tidak didukung pada browser ini'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
          db.createObjectStore(STORE_PRODUCTS, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
          db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'no' });
        }
      };
    });
  }

  function fetchAllProducts(db) {
    return new Promise((resolve, reject) => {
      if (!db || !db.objectStoreNames.contains(STORE_PRODUCTS)) {
        resolve([]);
        return;
      }
      const tx = db.transaction(STORE_PRODUCTS, 'readonly');
      const store = tx.objectStore(STORE_PRODUCTS);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result || [];
        const map = new Map();
        items.forEach((p) => {
          const k = p.key || (window.getProductKey ? window.getProductKey(p.produk, p.penitip) : `${p.produk}__${p.penitip}`);
          if (k) map.set(k, { ...p, key: k });
        });
        resolve(Array.from(map.values()));
      };
      request.onerror = () => reject(request.error);
    });
  }

  function fetchAllTransactions(db) {
    return new Promise((resolve) => {
      if (!db || !db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        resolve([]);
        return;
      }
      const tx = db.transaction(STORE_TRANSACTIONS, 'readonly');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  function saveTransactionToDB(db, txData) {
    return new Promise((resolve, reject) => {
      if (!db || !db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        resolve();
        return;
      }
      const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      const req = store.put(txData);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function upsertProductInDB(db, product) {
    return new Promise((resolve, reject) => {
      if (!db || !db.objectStoreNames.contains(STORE_PRODUCTS)) {
        resolve();
        return;
      }
      const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
      const store = tx.objectStore(STORE_PRODUCTS);
      const k = product.key || (window.getProductKey ? window.getProductKey(product.produk, product.penitip) : `${product.produk}__${product.penitip}`);
      const req = store.put({ ...product, key: k });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function syncProductsToDB(db, products) {
    return new Promise((resolve, reject) => {
      if (!db || !db.objectStoreNames.contains(STORE_PRODUCTS)) {
        resolve();
        return;
      }
      const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
      const store = tx.objectStore(STORE_PRODUCTS);
      products.forEach((p) => {
        const k = p.key || (window.getProductKey ? window.getProductKey(p.produk, p.penitip) : `${p.produk}__${p.penitip}`);
        store.put({ ...p, key: k });
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function clearAllDatabaseStores(db) {
    return new Promise((resolve, reject) => {
      if (!db) {
        resolve();
        return;
      }
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

  // Export to global scope
  window.KDMPDB = {
    DB_NAME,
    STORE_PRODUCTS,
    STORE_TRANSACTIONS,
    DB_VERSION,
    openDatabase,
    fetchAllProducts,
    fetchAllTransactions,
    saveTransactionToDB,
    upsertProductInDB,
    syncProductsToDB,
    clearAllDatabaseStores
  };

  window.openDatabase = openDatabase;
  window.fetchAllProducts = fetchAllProducts;
  window.fetchAllTransactions = fetchAllTransactions;
  window.saveTransactionToDB = saveTransactionToDB;
  window.upsertProductInDB = upsertProductInDB;
  window.syncProductsToDB = syncProductsToDB;
  window.clearAllDatabaseStores = clearAllDatabaseStores;
})();
