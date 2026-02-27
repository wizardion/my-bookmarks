import {
  BookmarkTypes, delay, IBookmarkNode, IBookmarkResponse, IBookmarkStatus, IEventListener, ResponseStatuses
} from 'core';
import { IBookmarkLevel, ResponseStatusCodes } from 'core/models/core.models';
import { BookmarkRenderService } from 'services/bookmarks-render.service';


export class BookmarkManagerService {
  static selection = new Set<number>();
  static bookmarks: Map<number, IBookmarkNode>;
  static timeout: number = 0;

  private static filtered: Map<number, IBookmarkNode> | null = null;
  private static signals: Map<number, AbortController> = new Map();
  private static listeners = new Map<'select', IEventListener>();

  public static setSelection(id: number, value: boolean) {
    const bookmark = this.bookmarks.get(id);

    if (bookmark) {
      bookmark.selected = value;

      if (bookmark.selected) {
        this.selection.add(id);
      } else {
        this.selection.delete(id);
      }

      this.onSelectionChange();
    }
  }

  public static getSelectedItems() {
    return Array.from(this.selection.values()).map(i => this.bookmarks.get(i)).filter(i => !!i.url);
  }

  public static getItems() {
    return Array.from(this.bookmarks.values()).filter(i => !!i.url);
  }

  public static async loadData(
    levelId: string,
    start: number,
    count: number,
    recursive: boolean,
    rebind?: boolean,
    filtered?: boolean
  ): Promise<IBookmarkNode[]> {
    if (rebind || !this.bookmarks) {
      const item = await this.loadBookmarks(levelId, recursive);

      this.filtered = null;
      this.bookmarks = new Map<number, IBookmarkNode>(item.map(i => [i.id, i]));
    } else if (filtered && !this.filtered) {
      const items = Array.from(this.bookmarks.values()).filter(i => i.status?.ok === false);

      this.filtered = this.bookmarks;
      this.bookmarks = new Map<number, IBookmarkNode>(items.map(i => [i.id, i]));
    } else if (!filtered && this.filtered) {
      this.bookmarks = this.filtered;
      this.filtered = null;
    }

    return Array.from(this.bookmarks.values()).slice(start, Math.min(this.bookmarks.size, start + count));
  }

  public static async removeSelected(progress: (i: number, t: number) => void) {
    const total = this.selection.size;
    const ids = Array.from(this.selection.values());

    for (let i = 0; i < ids.length; progress(++i, total)) {
      const bookmark = await this.getBookmark(ids[i]);

      if (bookmark && this.bookmarks.has(bookmark.id)) {
        if (BookmarkRenderService.recursive && !bookmark.url) {
          const subItems = await this.loadBookmarks(bookmark.id.toString(), true);
          const selected = subItems.filter(i => this.selection.has(Number(i.id)));

          if (selected.length === subItems.length) {
            await chrome.bookmarks.removeTree(bookmark.id.toString());
            selected.forEach(i => this.bookmarks.delete(Number(i.id)));
            selected.forEach(i => this.filtered?.delete(Number(i.id)));
            this.bookmarks.delete(Number(bookmark.id));
            this.filtered?.delete(Number(bookmark.id));
          } else {
            this.bookmarks.get(bookmark.id).selected = false;
          }
        } else if (!bookmark.url) {
          await chrome.bookmarks.removeTree(bookmark.id.toString());
          this.bookmarks.delete(bookmark.id);
          this.filtered?.delete(bookmark.id);
        } else {
          await chrome.bookmarks.remove(bookmark.id.toString());
          this.bookmarks.delete(bookmark.id);
          this.filtered?.delete(bookmark.id);
        }

        await delay(10);
      }
    }

    await delay(1250);
    this.selection.clear();
    this.onSelectionChange();
  }

  public static async checkUrl(url: string, method = 'HEAD', level: number = 0): Promise<IBookmarkStatus> {
    if (url.match(/^chrome/g,)) {
      await delay(500);

      return this.getStatus({ ok: false, status: -3, statusText: 'Scheme "chrome" is not supported.' });
    }

    const controller = new AbortController();
    const id = Number(setTimeout(() => controller.abort('timeout'), this.timeout * 1000));
    this.signals.set(id, controller);

    try {
      const response = await fetch(url, {
        method: method,
        // cache: 'no-cache',
        mode: 'cors',
        signal: controller.signal,
        referrer: url,
        // window: null,
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'content-type,x-pingother',
          'Content-Security-Policy': `script-src 'self' ${url};`,
          // 'Cache': 'no-cache'
          'User-Agent': window.navigator.userAgent,
        
          // Tells the server what formats you accept
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          
          // Mimics a request coming from a navigation event
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          
          // Optional: Helps if the site checks where you came from
          'Referer': url
        }),
      });

      if (response.status === 0 && (response.type === 'opaque' || response.type === 'opaqueredirect')) {
        return this.getStatus({ ok: false, status: 403, statusText: response.statusText });
      }

      if (response.redirected) {
        const url1 = new URL(url);
        const url2 = new URL(response.url);

        if (url1.pathname !== url2.pathname && url2.pathname === '/') {
          return this.getStatus({ ok: false, status: 301, statusText: response.statusText });
        }
      }

      if ((method === 'HEAD' && ([403, 404, 405].includes(response.status) || response.status >= 500))) {
        clearTimeout(id);
        this.signals.delete(id);
        return this.checkUrl(url, 'GET', level + 1);
      }

      return this.getStatus({ ok: response.ok, status: response.status, statusText: response.statusText });
    } catch (error) {
      if (error === 'stop') {
        return this.getStatus({ ok: false, status: -5, statusText: 'Canceled' });
      }

      if (error === 'timeout') {
        return this.getStatus({ ok: false, status: -1, statusText: 'Request is timed out' });
      }

      console.log("Fetch error:", String(error), url);

      return this.getStatus({ ok: false, status: -6, statusText: 'Failed to request URL' });
    } finally {
      this.signals.delete(id);
      clearTimeout(id);
      await delay(500);
    }
  }

  public static abort() {
    for (let [_, signal] of this.signals) {
      signal.abort('stop');
    }

    this.signals.clear();
  }

  public static addEventListener(type: 'select', listener: IEventListener): void {
    if (type === 'select') {
      this.listeners.set(type, () => listener());
    }
  }

  private static onSelectionChange() {
    const listener = this.listeners.get('select');

    if (listener) {
      listener();
    }
  }

  private static async loadBookmarks(id: string, recursive?: boolean, level = 0): Promise<IBookmarkNode[]> {
    let children: chrome.bookmarks.BookmarkTreeNode[];
    const levels = await this.getBookmarkLevels(id);

    try {
      children = await chrome.bookmarks.getChildren(id);
    } catch (error) {
      console.log('error:', error);
      children = [];
    }

    if (recursive) {
      let results: IBookmarkNode[] = [];

      for (let i = 0; i < children.length; i++) {
        const bookmark = children[i];
        const node: IBookmarkNode = {
          id: Number(bookmark.id),
          level: level,
          title: bookmark.title,
          type: bookmark.url ? BookmarkTypes.LINK : BookmarkTypes.FOLDER,
          url: bookmark.url,
          path: levels
        };

        results.push(node);

        if (!node.url) {
          results = results.concat(await this.loadBookmarks(bookmark.id, recursive, level + 1));
        }
      }

      return results;
    }

    return children.map(i => ({
      id: Number(i.id),
      level: level,
      title: i.title,
      type: i.url ? BookmarkTypes.LINK : BookmarkTypes.FOLDER,
      url: i.url,
      path: levels
    }));
  }

  private static async getBookmark(id: number): Promise<IBookmarkNode | null> {
    try {
      const [item] = await chrome.bookmarks.get(id.toString());

      return {
        id: Number(item.id),
        level: 0,
        title: item.title,
        type: item.url ? BookmarkTypes.LINK : BookmarkTypes.FOLDER,
        url: item.url,
        path: []
      };
    } catch (error) {
      console.log('error', error);

      return null;
    }
  }

  private static async getBookmarkLevels(id: number | string): Promise<IBookmarkLevel[]> {
    try {
      const levels: IBookmarkLevel[] = [];
      let [bookmark] = await chrome.bookmarks.get(String(id));

      while (bookmark && bookmark.parentId) {
        levels.push({id: bookmark.id, title: bookmark.title});
        [bookmark] = await chrome.bookmarks.get(bookmark.parentId);
      }

      return levels;
    } catch (error) {
      console.log('Error getting bookmark path', error);

      return [];
    }
  }

  private static getStatus(response: IBookmarkResponse): IBookmarkStatus {
    if (response.ok) {
      return { ok: true, code: ResponseStatusCodes.ok, className: 'success', title: ResponseStatuses.success };
    }

    if (response.status === -5) {
      return { ok: true, code: ResponseStatusCodes.canceled, className: null, title: null };
    }

    if (response.status === -6) {
      return { ok: false, code: ResponseStatusCodes.down, className: 'error', title: response.statusText };
    }

    if ([301, 302].includes(response.status)) {
      return {
        ok: false, code: ResponseStatusCodes.redirected, className: 'redirected',
        title: response.statusText || ResponseStatuses.redirected
      };
    }

    if ([-1, 408, 429, 504, 503].includes(response.status)) {
      return {
        ok: false, code: ResponseStatusCodes.timeout, className: 'timeout',
        title: ResponseStatuses.timeout
      };
    }

    if (response.status > 499 || [423, -2].includes(response.status)) {
      return { ok: false, code: ResponseStatusCodes.error, className: 'error', title: ResponseStatuses.error };
    }

    if ([404, 406, 410].includes(response.status)) {
      return {
        ok: false, code: ResponseStatusCodes.lost, className: 'lost',
        title: `${ResponseStatuses.lost} [${response.status}]`
      };
    }

    if ([-3, 401, 402, 403, 407, 422, 451, 423].includes(response.status)) {
      return {
        ok: false, code: ResponseStatusCodes.forbidden, className: 'forbidden',
        title: `${ResponseStatuses.forbidden} [${response.status}]`
      };
    }

    return {
      ok: false, code: ResponseStatusCodes.unsuccessful, className: 'unsuccessful',
      title: response.statusText || `${ResponseStatuses.unsuccessful} [${response.status}]`
    };
  }
}
