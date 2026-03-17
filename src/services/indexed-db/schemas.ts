import { IDBPDatabase, openDB } from 'idb';
import { IBookmarkDB } from './models/db.models';
import { DB_NAME, DB_VERSION, STORE_NAME } from './utils/schemas.constant';

export async function initDB(): Promise<IDBPDatabase<IBookmarkDB>> {
  return openDB<IBookmarkDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create the object store only if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

        // Create indexes for searching
        store.createIndex('by-parent-path', ['parentId', 'pathSort']);
        store.createIndex('by-code', 'code');

        // Create indexes for sorting
        store.createIndex('by-path', 'pathSort');
      }
    },
  });
}
