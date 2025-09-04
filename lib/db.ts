// A simple IndexedDB wrapper for storing podcast files.

const DB_NAME = 'podcast-player-db';
const DB_VERSION = 1;
const STORE_NAME = 'podcasts';

let db: IDBDatabase | null = null;

// Opens and initializes the IndexedDB database.
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening IndexedDB.');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };

    // This event is only fired when the version number changes.
    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Saves a podcast file (File/Blob object) to IndexedDB.
 * @param id The unique identifier for the podcast.
 * @param file The File object to be stored.
 */
export async function savePodcastToDB(id: string, file: File): Promise<void> {
  const dbInstance = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, id);

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

/**
 * Retrieves a podcast file from IndexedDB.
 * @param id The unique identifier for the podcast.
 * @returns The File object if found, otherwise undefined.
 */
export async function getPodcastFromDB(id: string): Promise<File | undefined> {
  const dbInstance = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}
