import { IBookmarkLevel } from "services/indexed-db/models/db.models";

export interface IBookmarkTreeNode extends chrome.bookmarks.BookmarkTreeNode {
  levels?: IBookmarkLevel[]
}