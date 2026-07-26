(function () {
  const DB_NAME = "KaamCardDB";
  const DB_VERSION = 2;
  const STORE_NAME = "session";
  const UPLOAD_QUEUE_STORE = "uploadQueue";

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
        if (!db.objectStoreNames.contains(UPLOAD_QUEUE_STORE)) {
          const store = db.createObjectStore(UPLOAD_QUEUE_STORE, { keyPath: "id", autoIncrement: true });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
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
    },

    // Upload Queue methods
    async enqueueUpload(fileData) {
      try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(UPLOAD_QUEUE_STORE, "readwrite");
          const request = tx.objectStore(UPLOAD_QUEUE_STORE).add({
            ...fileData,
            status: "pending",
            createdAt: Date.now(),
            retryCount: 0
          });
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.warn("IndexedDB not available, falling back to localStorage for upload queue");
        // Fallback to localStorage
        const queue = JSON.parse(localStorage.getItem("kaam_upload_queue") || "[]");
        const item = { ...fileData, id: Date.now(), status: "pending", createdAt: Date.now(), retryCount: 0 };
        queue.push(item);
        localStorage.setItem("kaam_upload_queue", JSON.stringify(queue));
        return item.id;
      }
    },

    async getUploadQueue() {
      try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(UPLOAD_QUEUE_STORE, "readonly");
          const request = tx.objectStore(UPLOAD_QUEUE_STORE).getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } catch {
        return JSON.parse(localStorage.getItem("kaam_upload_queue") || "[]");
      }
    },

    async updateUploadStatus(id, status, error = null) {
      try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(UPLOAD_QUEUE_STORE, "readwrite");
          const store = tx.objectStore(UPLOAD_QUEUE_STORE);
          const getRequest = store.get(id);
          getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) {
              item.status = status;
              item.updatedAt = Date.now();
              if (error) item.lastError = error;
              if (status === "pending") item.retryCount = (item.retryCount || 0) + 1;
              store.put(item);
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          };
          getRequest.onerror = () => reject(getRequest.error);
        });
      } catch {
        const queue = JSON.parse(localStorage.getItem("kaam_upload_queue") || "[]");
        const idx = queue.findIndex(i => i.id === id);
        if (idx >= 0) {
          queue[idx].status = status;
          queue[idx].updatedAt = Date.now();
          if (error) queue[idx].lastError = error;
          if (status === "pending") queue[idx].retryCount = (queue[idx].retryCount || 0) + 1;
          localStorage.setItem("kaam_upload_queue", JSON.stringify(queue));
        }
      }
    },

    async removeUpload(id) {
      try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(UPLOAD_QUEUE_STORE, "readwrite");
          tx.objectStore(UPLOAD_QUEUE_STORE).delete(id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        let queue = JSON.parse(localStorage.getItem("kaam_upload_queue") || "[]");
        queue = queue.filter(i => i.id !== id);
        localStorage.setItem("kaam_upload_queue", JSON.stringify(queue));
      }
    },

    async clearUploadQueue() {
      try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(UPLOAD_QUEUE_STORE, "readwrite");
          tx.objectStore(UPLOAD_QUEUE_STORE).clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        localStorage.removeItem("kaam_upload_queue");
      }
    }
  };
})();
