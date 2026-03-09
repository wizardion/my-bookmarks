
import { generateNKeysBetween } from 'fractional-indexing';
import { BookmarksAPIService } from 'services/bookmarks-api/bookmarks-api.service';
import { IBookmarkTreeNode } from 'services/bookmarks-api/models/bookmarks-api.models';
import { IndexedDBManager } from 'services/indexed-db/bookmark-manager.service';
import { BookmarkTypes } from 'services/indexed-db/models/db.enums';
import { IBookmarkNode } from 'services/indexed-db/models/db.models';

export function convert(bookmark: IBookmarkTreeNode, key?: string): IBookmarkNode {
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
    // pathSort: generateKeyIndex(bookmark.index, bookmark.levels),
    pathSort: key || '',
    created: bookmark.dateAdded || new Date().getTime()
  };
}

function generateNKeys(
  first: string,
  count: number,
  level: number
): string[] {
  const digits = String(Math.abs(count)).length;
  // const letter = String.fromCharCode(level + 97);
  const letter = '';
  const list: string[] = [];

  for (let i = 0; i < count; i++) {
    if (first) {
      list.push(first + letter + i.toString().padStart(digits, '0'));
    } else {
      list.push(letter + i.toString().padStart(digits, '0'));
    }
  }

  return list;
}

export async function syncSubtree(
  api: BookmarksAPIService,
  db: IndexedDBManager,
  parentId: number,
  parentPath: string | null = null,
  nextParentPath: string | null = null,
  level = 0
) {
  const children = await api.getChildren(parentId) || [];

  if (children.length === 0) { return; }

  console.log(
    level, ' '.repeat(level), parentId, (await api.get(parentId))?.title,
    children.length,
    parentPath, nextParentPath
  );

  // const keys = generateNKeys(parentPath, children.length + 1, level);
  const keys = generateNKeysBetween(parentPath, nextParentPath, children.length + 1);

  console.log(level, ' '.repeat(level), keys.join());

  await db.restore(children.map((l, i) => convert(l, keys[i])));

  for (let i = 0; i < children.length; i++) {
    const bookmark = children[i];

    await syncSubtree(api, db, Number(bookmark.id), keys[i], keys[i + 1], level + 1);
  }
}
