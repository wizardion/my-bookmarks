import { IDBPDatabase } from 'idb';
import { initDB } from './schemas';
import { IBookmarkDB, BookmarkDBIndexTypes, IBookmarkNode } from './models/db.models';
import { STORE_NAME } from './utils/schemas.constant';
import { BookmarkTypes } from './models/db.enums';


export class IndexedDBManager {
  private dbPromise: Promise<IDBPDatabase<IBookmarkDB>>;

  constructor() {
    this.dbPromise = initDB();
  }

  async get(id: number): Promise<IBookmarkNode | undefined> {
    const db = await this.dbPromise;

    return db.get(STORE_NAME, id);
  }

  async create(bookmark: IBookmarkNode): Promise<number> {
    const db = await this.dbPromise;

    return db.add(STORE_NAME, <IBookmarkNode>bookmark);
  }

  async getChildren(
    parentId: number,
    offset: number | null = null,
    limit: number | null = null,
    children: boolean = false,
    direction: 'next' | 'prev' = 'next'
  ): Promise<IBookmarkNode[]> {
    if (children) {
      const parent = await this.get(parentId);
      const range = IDBKeyRange.bound(
        parent?.pathSort || '', (parent?.pathSort || '') + '\uffff', true
      );

      return this.getPaginatedResults('by-path', range, offset, limit, direction);
    }

    const range = IDBKeyRange.only(parentId);

    return this.getPaginatedResults('by-parent-id', range, offset, limit, direction);

    // if (offset === null || limit === null) {
    //   const db = await this.dbPromise;

    //   return db.getAllFromIndex(STORE_NAME, 'by-parent-id', parentId);
    // }

    // if (children) {
    //   return this.getPaginatedResults(
    //     'by-parent-id', IDBKeyRange.lowerBound(parentId), offset, limit, direction
    //   );
    // }

    // return this.getPaginatedResults(
    //   'by-parent-id', IDBKeyRange.only(parentId), offset, limit, direction
    // );
  }

  async getChildrenCount(parentId: number): Promise<number> {
    const db = await this.dbPromise;

    return db.countFromIndex(STORE_NAME, 'by-parent-id', parentId);
  }

  async getByType(type: BookmarkTypes): Promise<IBookmarkNode[]> {
    const db = await this.dbPromise;

    return db.getAllFromIndex(STORE_NAME, 'by-type', type);
  }

  async getByCode(code: number): Promise<IBookmarkNode[]> {
    const db = await this.dbPromise;

    return db.getAllFromIndex(STORE_NAME, 'by-code', code);
  }

  // Exact title match. (Note: IndexedDB natively only supports exact or prefix matches)
  async getByTitle(title: string): Promise<IBookmarkNode[]> {
    const db = await this.dbPromise;

    return db.getAllFromIndex(STORE_NAME, 'by-title', title);
  }

  /**
   * Returns the total number of bookmark records in the store.
   * This is an O(1) or O(log N) operation depending on the browser's
   * implementation, making it very fast.
   */
  async getCount(): Promise<number> {
    const db = await this.dbPromise;

    // We use a 'readonly' transaction for simple count operations
    return db.count(STORE_NAME);
  }

  /**
   * Returns the number of records that match a specific index value.
   * Example: count how many 'FOLDER' types exist.
   */
  async getCountByType(type: BookmarkTypes): Promise<number> {
    const db = await this.dbPromise;

    return db.countFromIndex(STORE_NAME, 'by-type', type);
  }

  // Prefix title match (e.g., searching for "Goo" finds "Google")
  async searchByPrefix(prefix: string): Promise<IBookmarkNode[]> {
    const db = await this.dbPromise;
    const range = IDBKeyRange.bound(prefix, prefix + '\uffff');

    return db.getAllFromIndex(STORE_NAME, 'by-title', range);
  }

  /**
   * Performs a full update or insert (Upsert).
   * If the ID exists, the record is overwritten.
   */
  async update(bookmark: IBookmarkNode): Promise<number> {
    const db = await this.dbPromise;

    return db.put(STORE_NAME, bookmark);
  }

  /**
   * Performs a partial update by ID.
   * Useful for toggling 'selected' or updating 'statusDetails'
   * without needing the full object beforehand.
   */
  async patch(id: number, changes: Partial<IBookmarkNode>): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // 1. Retrieve the existing record
    const existing = await store.get(id);

    if (existing) {
      // 2. Merge existing data with new changes
      const updated = { ...existing, ...changes };

      // 3. Save it back
      await store.put(updated);
    } else {
      throw new Error(`Bookmark with ID ${id} not found.`);
    }

    await tx.done;
  }

  /**
   * Deletes a single bookmark by its ID.
   * O(1) time complexity.
   */
  async remove(id: number): Promise<void> {
    const db = await this.dbPromise;

    await db.delete(STORE_NAME, id);
  }

  /**
   * Deletes multiple bookmarks by their IDs in a single transaction.
   * This is much more efficient for bulk actions than multiple individual calls.
   */
  async removeBulk(ids: number[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');

    await Promise.all([
      ...ids.map(id => tx.store.delete(id)),
      tx.done
    ]);
  }

  /**
   * Clears all bookmarks from the store.
   * Useful for a complete reset/restore.
   */
  async clear(): Promise<void> {
    const db = await this.dbPromise;

    await db.clear(STORE_NAME);
  }

  async count(): Promise<number> {
    const db = await this.dbPromise;

    return db.count(STORE_NAME);
  }

  /**
   * Deletes a folder and all its nested children.
   * This scans the 'path' property of all bookmarks.
   */
  // async deleteFolderRecursive(folderId: string): Promise<void> {
  //   const db = await this.dbPromise;
  //   const tx = db.transaction(STORE_NAME, 'readwrite');
  //   const store = tx.store;

  //   let cursor = await store.openCursor();

  //   while (cursor) {
  //     const bookmark = cursor.value;

  //     // Check if the current bookmark is the folder itself
  //     // OR if the folderId exists anywhere in its path array
  //     const isTargetFolder = bookmark.id === Number(folderId);
  //     const isChild = bookmark.id.some(p => p.id === folderId);

  //     if (isTargetFolder || isChild) {
  //       await cursor.delete();
  //     }

  //     cursor = await cursor.continue();
  //   }

  //   await tx.done;
  //   console.log(`Folder ${folderId} and all nested items removed.`);
  // }

  // --- SORTING ---
  // IndexedDB sorts automatically when you read from an index.
  // Passing "prev" as the direction sorts descending. Omit it for ascending.
  // async getAllSortedByOrder(direction: 'next' | 'prev' = 'next'):
  // Promise<BookmarkNode[]> {
  //   const db = await this.dbPromise;
  //   const tx = db.transaction(STORE_NAME, 'readonly');
  //   const index = tx.store.index('by-order');

  //   let cursor = await index.openCursor(null, direction);
  //   const results: BookmarkNode[] = [];

  //   while (cursor) {
  //     results.push(cursor.value);
  //     cursor = await cursor.continue();
  //   }
  //   return results;
  // }

  // async getAllSortedByCreated(direction: 'next' | 'prev' = 'next'):
  // Promise<BookmarkNode[]> {
  //   const db = await this.dbPromise;
  //   const tx = db.transaction(STORE_NAME, 'readonly');
  //   const index = tx.store.index('by-created');

  //   let cursor = await index.openCursor(null, direction);
  //   const results: BookmarkNode[] = [];

  //   while (cursor) {
  //     results.push(cursor.value);
  //     cursor = await cursor.continue();
  //   }
  //   return results;
  // }

  // --- RESTORING ---
  // Clears the existing DB and inserts a fresh batch of bookmarks
  async restore(bookmarks: IBookmarkNode[]): Promise<void> {
    if (bookmarks.length) {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_NAME, 'readwrite');

      // Insert all new records
      // Using Promise.all to add them concurrently within the transaction
      await Promise.all([
        ...bookmarks.map(bookmark => tx.store.add(bookmark)),
        tx.done // Ensure the transaction completes successfully
      ]);

      // console.log(`Successfully created ${bookmarks.length} bookmarks.`);
    }
  }

  // --- PAGINATED SORTING ---

  /**
   * Retrieves a paginated list of bookmarks sorted by their order.
   * @param indexName The name of the index.
   * @param range The key range to filter results.
   * @param offset The number of records to skip.
   * @param limit The maximum number of records to return.
   * @param direction 'next' for ascending, 'prev' for descending.
   */
  private async getPaginatedResults(
    indexName: BookmarkDBIndexTypes,
    range: IDBKeyRange,
    offset: number = 0,
    limit: number = 50,
    direction: 'next' | 'prev' = 'next'
  ): Promise<IBookmarkNode[]> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.store.index(indexName);
    const results: IBookmarkNode[] = [];
    let cursor = await index.openCursor(range, direction);

    // Fast-forward the cursor to skip the offset
    // Note: advance() throws an error if called with 0
    if (cursor && offset > 0) {
      await cursor.advance(offset);
    }

    // Collect records up to the limit
    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }

    console.log('results.length', range, [limit, results.length]);

    return results;
  }
}
