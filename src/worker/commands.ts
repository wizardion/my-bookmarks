
import { BookmarksAPIService } from 'services/bookmarks-api/bookmarks-api.service';
import { IBookmarkTreeNode } from 'services/bookmarks-api/models/bookmarks-api.models';
import { IndexedDBManager } from 'services/indexed-db/bookmark-manager.service';
import { BookmarkTypes } from 'services/indexed-db/models/db.enums';
import { IBookmarkNode } from 'services/indexed-db/models/db.models';

function generateKey(first: string, index: number, count: number): string {
  const digits = String(Math.abs(count)).length;

  return first + index.toString().padStart(digits, '0');
}

function generateNKeys(first: string, count: number): string[] {
  const digits = String(Math.abs(count)).length;
  const list: string[] = [];

  for (let i = 0; i < count; i++) {
    if (first) {
      list.push(first + i.toString().padStart(digits, '0'));
    } else {
      list.push(i.toString().padStart(digits, '0'));
    }
  }

  return list;
}

export function convert(bookmark: IBookmarkTreeNode, pathSort?: string): IBookmarkNode {
  return {
    id: Number(bookmark.id),
    parentId: bookmark.parentId ? Number(bookmark.parentId) : null,
    title: bookmark.title,
    url: bookmark.url,
    levels: bookmark.levels || [],
    type: bookmark.url ? BookmarkTypes.LINK : BookmarkTypes.FOLDER,
    selected: false,
    code: 0,
    index: bookmark.index,
    pathSort: pathSort || '',
    created: bookmark.dateAdded || new Date().getTime()
  };
}

export async function retrieveKey(
  api: BookmarksAPIService,
  db: IndexedDBManager,
  bookmark: IBookmarkTreeNode
): Promise<string> {
  const parent = await db.get(Number(bookmark.parentId));
  const count = await api.count(Number(bookmark.parentId));

  return generateKey(parent.pathSort, bookmark.index, count);
}

export async function syncSubtree(
  api: BookmarksAPIService,
  db: IndexedDBManager,
  parentId: number = 0,
  parentPath: string | null = null
) {
  const children = await api.getChildren(parentId) || [];

  if (children.length === 0) { return; }

  const keys = generateNKeys(parentPath, children.length);

  await db.restore(children.map((l, i) => convert(l, keys[i])));

  for (let i = 0; i < children.length; i++) {
    const bookmark = children[i];

    await syncSubtree(api, db, Number(bookmark.id), keys[i]);
  }
}
