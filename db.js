(function () {
  const DB_NAME = "KaamCardDB";
  const DB_VERSION = 1;
  const STORE_NAME = "session";

  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB not supported"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
    return dbPromise;
  }

  window.KaamDb = {
    async set(key, value) {
      try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          tx.objectStore(STORE_NAME).put({ key, value });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        try { localStorage.setItem("kcdb_" + key, JSON.stringify(value)); } catch {}
      }
    },

    async get(key) {
      try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readonly");
          const request = tx.objectStore(STORE_NAME).get(key);
          request.onsuccess = () => resolve(request.result ? request.result.value : null);
          request.onerror = () => reject(request.error);
        });
      } catch {
        try {
          const raw = localStorage.getItem("kcdb_" + key);
          return raw ? JSON.parse(raw) : null;
        } catch { return null; }
      }
    },

    async remove(key) {
      try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          tx.objectStore(STORE_NAME).delete(key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        try { localStorage.removeItem("kcdb_" + key); } catch {}
      }
    },

    async clear() {
      try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          tx.objectStore(STORE_NAME).clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        // best-effort
      }
    }
  };
})();
