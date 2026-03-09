
import { BookmarksAPIService } from 'services/bookmarks-api/bookmarks-api.service';
import { IndexedDBManager } from 'services/indexed-db/bookmark-manager.service';
import { convert } from './commands';
import { IReorderInfo } from './models/background.models';

const MANAGER_PAGE = 'manager.html';

chrome.runtime.onInstalled.addListener(async () => {
  const api = new BookmarksAPIService();
  const db = new IndexedDBManager();
  let queue = await api.getChildren(0);

  await db.clear();
  await db.restore(queue.map(i => convert(i)));

  while (queue && queue.length) {
    const bookmark = queue.shift();
    const children = await api.getChildren(Number(bookmark.id)) || [];

    await db.restore(children.map(i => convert(i)));
    queue = queue.concat(children);
  }

  console.log(`Successfully restored all ${await db.count()} bookmarks.`);

  await chrome.action.setPopup({ popup: '' });
  await chrome.alarms.create({ delayInMinutes: 1 });
});

chrome.action.onClicked.addListener(async () => {
  chrome.runtime.sendMessage('sync');

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

  await db.create(convert(bookmark));
});

chrome.bookmarks.onRemoved.addListener(async (id: string) => {
  const db = new IndexedDBManager();

  await db.remove(Number(id));
});

chrome.bookmarks.onChanged.addListener(async (id: string) => {
  const api = new BookmarksAPIService();
  const db = new IndexedDBManager();
  const bookmark = await api.get(Number(id));

  await db.patch(Number(bookmark.id), {
    title: bookmark.title,
    url: bookmark.url,
    index: bookmark.index
  });

  console.log(`Successfully updated bookmark: ${bookmark.id}.`);
});

chrome.bookmarks.onMoved.addListener(async (id: string) => {
  const api = new BookmarksAPIService();
  const db = new IndexedDBManager();
  const bookmark = await api.get(Number(id));

  await db.patch(Number(bookmark.id), {
    parentId: Number(bookmark.parentId),
    index: bookmark.index
  });

  console.log(`Successfully moved bookmark: ${bookmark.id}.`);
});

chrome.bookmarks.onChildrenReordered.addListener(
  async (id: string, reorderInfo: IReorderInfo) => {
    const api = new BookmarksAPIService();
    const db = new IndexedDBManager();
    const bookmark = await api.get(Number(id));

    await db.patch(Number(bookmark.id), { index: bookmark.index });

    for (const id of reorderInfo.childIds) {
      const bookmark = await api.get(Number(id));

      await db.patch(Number(bookmark.id), { index: bookmark.index });
    }

    console.log(`Successfully ordered ${reorderInfo.childIds.length + 1} bookmarks.`);
  }
);
