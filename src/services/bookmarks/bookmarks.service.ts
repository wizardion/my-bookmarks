import { CachedAsync } from 'core';
import { IndexedDBManager } from '../indexed-db/bookmark-manager.service';
import { IBookmarkNode } from '../indexed-db/models/db.models';

export class BookmarksService {
  private db: IndexedDBManager;

  constructor(db: IndexedDBManager) {
    this.db = db;
  }

  @CachedAsync
  public async getChildrenCount(
    id: number,
    recursive: boolean
  ): Promise<number> {
    return await this.db.getChildrenCount(id, recursive);
  }

  public async getChildren(
    id: number,
    recursive: boolean,
    offset?: number,
    limit?: number,
  ): Promise<IBookmarkNode[]> {
    if (offset >= 0 && limit >= 0) {
      return this.db.getChildren(id, offset, limit, recursive);
    }

    return this.db.getAllChildren(id, recursive);
  }
}
