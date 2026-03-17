import { IBookmarkLevel } from 'services/indexed-db/models/db.models';


export interface IBookmarkTreeNode extends chrome.bookmarks.BookmarkTreeNode {
  levels?: IBookmarkLevel[]
  next?: IBookmarkTreeNode;
  prev?: IBookmarkTreeNode
  key?: string;
  lastKey?: string;
}
