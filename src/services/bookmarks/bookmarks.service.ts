// import { BookmarksAPIService } from '../bookmarks-api/bookmarks-api.service';
import { IndexedDBManager } from '../indexed-db/bookmark-manager.service';
import { IBookmarksFilters } from './models/bookmarks.models';
import { IBookmarkNode } from '../indexed-db/models/db.models';
import { DEFAULT_FILTERS } from './utils/bookmark.constant';

export class BookmarksService {
  public static filters: IBookmarksFilters = DEFAULT_FILTERS;

  static total: number = 0;

  public static async getChildren(id: number): Promise<IBookmarkNode[]> {
    const db = new IndexedDBManager();
    const start = (this.filters.page - 1) * this.filters.itemsPerPage;

    this.total = await db.getChildrenCount(id);

    return db.getChildren(
      id, start, start + this.filters.itemsPerPage, this.filters.recursive
    );
  }
}
