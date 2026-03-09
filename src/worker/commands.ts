
import { IBookmarkTreeNode } from 'services/bookmarks-api/models/bookmarks-api.models';
import { BookmarkTypes } from 'services/indexed-db/models/db.enums';
import { IBookmarkNode } from 'services/indexed-db/models/db.models';

export function convert(bookmark: IBookmarkTreeNode): IBookmarkNode {
  return {
    id: Number(bookmark.id),
    parentId: bookmark.parentId ? Number(bookmark.parentId) : null,
    title: bookmark.title,
    url: bookmark.url,
    level: bookmark.levels?.length || 0,
    levels: bookmark.levels || [],
    type: bookmark.url ? BookmarkTypes.LINK : BookmarkTypes.FOLDER,
    selected: false,
    code: 0,
    index: bookmark.index,
    created: bookmark.dateAdded || new Date().getTime()
  };
}
