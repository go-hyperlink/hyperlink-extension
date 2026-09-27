// IndexedDB Storage Service for heavy items (Recordings, Full Canvas Images)

const DB_NAME = 'hyperlink_media_db';
const DB_VERSION = 1;
const STORE_RECORDINGS = 'recordings';
const STORE_SCREENSHOTS = 'screenshots';

export interface StoredRecording {
  id: string;
  blob: Blob;
  name: string;
  duration: number;
  timestamp: number;
  size: number;
  mode: string;
}

class IndexedDBService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_RECORDINGS)) {
          db.createObjectStore(STORE_RECORDINGS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SCREENSHOTS)) {
          db.createObjectStore(STORE_SCREENSHOTS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  async saveRecording(recording: StoredRecording): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RECORDINGS, 'readwrite');
      const store = tx.objectStore(STORE_RECORDINGS);
      const req = store.put(recording);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getRecordings(): Promise<StoredRecording[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RECORDINGS, 'readonly');
      const store = tx.objectStore(STORE_RECORDINGS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteRecording(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RECORDINGS, 'readwrite');
      const store = tx.objectStore(STORE_RECORDINGS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const indexedDBService = new IndexedDBService();
