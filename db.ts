
export const db = {
  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MrEgyptDB', 2); // Increased version
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async save(key: string, val: any): Promise<boolean> {
    try {
      const database = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction('data', 'readwrite');
        const store = transaction.objectStore('data');
        const request = store.put(val, key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("IndexedDB Save Error:", err);
      return false;
    }
  },

  async get(key: string): Promise<any> {
    try {
      const database = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction('data', 'readonly');
        const store = transaction.objectStore('data');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("IndexedDB Get Error:", err);
      return null;
    }
  }
};
