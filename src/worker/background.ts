
import { BookmarksAPIService } from 'services/bookmarks-api/bookmarks-api.service';
import { IndexedDBManager } from 'services/indexed-db/bookmark-manager.service';
import { convert, retrieveKey, syncSubtree } from './commands';
import { IReorderInfo } from './models/background.models';
import { IAppMessage, AppMessageTypes } from 'core';
import { IBookmarkNode } from 'services/indexed-db/models/db.models';

const MANAGER_PAGE = 'manager.html';

chrome.runtime.onInstalled.addListener(async () => {
  const api = new BookmarksAPIService();
  const db = new IndexedDBManager();

  await db.clear();
  await syncSubtree(api, db);

  console.log(`Successfully restored all ${await db.count()} bookmarks.`);

  await chrome.action.setPopup({ popup: '' });
  await chrome.tabs.create({ url: MANAGER_PAGE });
});

chrome.action.onClicked.addListener(async () => {
  // 1. Get the full extension URL
  const fullUrl = chrome.runtime.getURL(MANAGER_PAGE);

  // 2. Query all tabs to see if it's already open
  const tabs = await chrome.tabs.query({ url: fullUrl });

  if (tabs.length > 0) {
    // 3. If found, focus the window and the specific tab
    const existingTab = tabs[0];

    if (existingTab.id) {
      await chrome.windows.update(existingTab.windowId, { focused: true });
      await chrome.tabs.update(existingTab.id, { active: true });
    }
  } else {
    // 4. If not found, open a new tab
    await chrome.tabs.create({ url: fullUrl });
  }
});

chrome.bookmarks.onCreated.addListener(async (id: string) => {
  const api = new BookmarksAPIService();
  const db = new IndexedDBManager();
  const bookmark = await api.get(Number(id));

  await db.create(
    convert(bookmark, await retrieveKey(api, db, bookmark))
  );
  await chrome.runtime.sendMessage(
    { ids: [Number(id)], type: AppMessageTypes.ADD } as IAppMessage
  );
});

chrome.bookmarks.onRemoved.addListener(async (id: string) => {
  const db = new IndexedDBManager();

  await db.remove(Number(id));
  await chrome.runtime.sendMessage(
    { ids: [Number(id)], type: AppMessageTypes.REMOVE } as IAppMessage
  );
});

chrome.bookmarks.onChanged.addListener(async (id: string) => {
  const api = new BookmarksAPIService();
  const db = new IndexedDBManager();
  const bookmark = await api.get(Number(id));

  await db.patch(Number(bookmark.id), {
    title: bookmark.title,
    url: bookmark.url,
    index: bookmark.index,
    pathSort: await retrieveKey(api, db, bookmark)
  });

  await chrome.runtime.sendMessage(
    { ids: [Number(id)], type: AppMessageTypes.CHANGE } as IAppMessage
  );
});

chrome.bookmarks.onMoved.addListener(async (id: string) => {
  const api = new BookmarksAPIService();
  const db = new IndexedDBManager();
  const bookmark = await api.get(Number(id));

  await db.patch(Number(bookmark.id), {
    parentId: Number(bookmark.parentId),
    index: bookmark.index,
    pathSort: await retrieveKey(api, db, bookmark)
  });

  await chrome.runtime.sendMessage(
    { ids: [Number(id)], type: AppMessageTypes.CHANGE } as IAppMessage
  );
});

chrome.bookmarks.onChildrenReordered.addListener(
  async (id: string, reorderInfo: IReorderInfo) => {
    const api = new BookmarksAPIService();
    const db = new IndexedDBManager();
    const bookmark = await api.get(Number(id));
    const changes: Partial<IBookmarkNode>[] = [{
      id: Number(bookmark.id),
      index: bookmark.index,
      pathSort: await retrieveKey(api, db, bookmark)
    }];

    for (const id of reorderInfo.childIds) {
      const item = await api.get(Number(id));

      changes.push({
        id: Number(item.id),
        index: item.index,
        pathSort: await retrieveKey(api, db, item)
      });
    }

    await db.patchBulk(changes);

    await chrome.runtime.sendMessage({
      ids: changes.map(i => i.id),
      type: AppMessageTypes.CHANGE
    } as IAppMessage);
  }
);
