import {
  BookmarkTypes, delay, IBookmarkNode, IBookmarkResponse, IBookmarkStatus, IEventListener, ResponseStatuses
} from 'core';
import { ResponseStatusCodes } from 'core/models/core.models';
import { BookmarkRenderService } from 'services/bookmarks-render.service';


export class BookmarkManagerService {
  static selection = new Set<number>();
  static bookmarks: Map<number, IBookmarkNode>;
  static timeout?: number;

  private static listeners = new Map<'select', IEventListener>();

  public static select(id: number): void {
    const bookmark = this.bookmarks.get(id);

    if (bookmark) {
      bookmark.selected = true;
      this.selection.add(id);

      this.onSelectionChange();
    }
  }

  public static unselect(id: number): void {
    const bookmark = this.bookmarks.get(id);

    if (bookmark) {
      bookmark.selected = false;
      this.selection.delete(id);

      this.onSelectionChange();
    }
  }

  public static async loadData(
    levelId: string,
    start: number,
    count: number,
    recursive: boolean,
    rebind?: boolean
  ): Promise<IBookmarkNode[]> {
    if (rebind || !this.bookmarks) {
      const item = await this.getBookmarks(levelId, recursive);

      this.bookmarks = new Map<number, IBookmarkNode>(item.map(i => [i.id, i]));
    }

    return Array.from(this.bookmarks.values()).slice(start, Math.min(this.bookmarks.size, start + count));
  }

  public static async removeSelected(progress: (i: number, t: number) => void) {
    const total = this.selection.size;
    const ids = Array.from(this.selection.values());

    for (let i = 0; i < ids.length; progress(++i, total)) {
      const [bookmark] = await chrome.bookmarks.get(ids[i].toString());

      if (bookmark && this.bookmarks.has(Number(bookmark.id))) {
        if (BookmarkRenderService.recursive && !bookmark.url) {
          const subItems = await this.getBookmarks(bookmark.id, true);
          const selected = subItems.filter(i => this.selection.has(Number(i.id)));

          if (selected.length === subItems.length) {
            // await chrome.bookmarks.removeTree(bookmark.id);
            selected.forEach(i => this.bookmarks.delete(Number(i.id)));
            this.bookmarks.delete(Number(bookmark.id));
          } else {
            this.bookmarks.get(Number(bookmark.id)).selected = false;
          }
        } else if (!bookmark.url) {
          // await chrome.bookmarks.removeTree(bookmark.id);
          this.bookmarks.delete(Number(bookmark.id));
        } else {
          // await chrome.bookmarks.remove(bookmark.id);
          this.bookmarks.delete(Number(bookmark.id));
        }

        await delay(10);
      }
    }

    await delay(1250);
    this.selection.clear();
    this.onSelectionChange();
  }

  public static async removeSelected2(progress: (i: number, t: number) => void) {
    const total = this.selection.size;
    const bookmarks = await chrome.bookmarks.get(Array.from(this.selection.values()).map(i => i.toString()));

    for (let i = 0; i < bookmarks.length; i++) {
      const bookmark = bookmarks[i];

      progress(i + 1, total);

      if (!BookmarkRenderService.recursive && !bookmark.url) {
        // await chrome.bookmarks.removeTree(bookmark.id);
      } else {
        // await chrome.bookmarks.remove(bookmark.id);
      }

      this.bookmarks.delete(Number(bookmark.id));
    }

    await delay(1250);

    this.selection.clear();
    this.onSelectionChange();
  }

  public static async preflight(url: string) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort('timeout'), this.timeout * 1000);
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        mode: 'no-cors',
        signal: controller.signal,
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
          'Cache': 'no-cache'
        }),
      });

      clearTimeout(id);

      if (response.type === 'opaque' || response.type === 'opaqueredirect') {
        return this.getStatus({ ok: false, status: 403, statusText: 'Cannot obtain data' });
      }

      return this.getStatus({ ok: response.ok, status: response.status, statusText: response.statusText });
    } catch (error) {
      return this.getStatus({
        ok: false, status: error === 'timeout' ? -1 : -2, statusText: 'Failed to request URL'
      });
    }
  }

  public static async checkUrl(url: string): Promise<IBookmarkStatus> {
    if (url.match(/^chrome/g,)) {
      await delay(500);

      return this.getStatus({ ok: false, status: -3, statusText: 'Scheme "chrome" is not supported.' });
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort('timeout'), this.timeout * 1000);
      const response = await fetch(url, {
        method: 'GET',
        // method: 'HEAD',
        // method: 'OPTIONS',
        cache: 'no-cache',
        mode: 'cors',
        // mode: 'no-cors',
        signal: controller.signal,
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
          // 'Access-Control-Allow-Methods': 'GET',
          // 'Access-Control-Allow-Headers': 'Content-Type',
          // 'Access-Control-Allow-Credentials': 'true',
          'Cache': 'no-cache'
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

      clearTimeout(id);

      return this.getStatus({ ok: response.ok, status: response.status, statusText: response.statusText });
    } catch (error) {
      if (error === 'timeout') {
        return this.getStatus({ ok: false, status: -1, statusText: 'Failed to request URL' });
      }

      return this.preflight(url);
    } finally {
      await delay(500);
    }
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

  private static async getBookmarks(levelId: string, recursive?: boolean, level = 0): Promise<IBookmarkNode[]> {
    const bookmarks = await chrome.bookmarks.getChildren(levelId);

    if (recursive) {
      let results: IBookmarkNode[] = [];

      for (let i = 0; i < bookmarks.length; i++) {
        const bookmark = bookmarks[i];
        const node: IBookmarkNode = {
          id: Number(bookmark.id),
          level: level,
          title: bookmark.title,
          type: bookmark.url ? BookmarkTypes.LINK : BookmarkTypes.FOLDER,
          url: bookmark.url
        };

        results.push(node);

        if (!node.url) {
          results = results.concat(await this.getBookmarks(bookmark.id, recursive, level + 1));
        }
      }

      return results;
    }

    return bookmarks.map(i => ({
      id: Number(i.id),
      level: level,
      title: i.title,
      type: i.url ? BookmarkTypes.LINK : BookmarkTypes.FOLDER,
      url: i.url
    }));
  }

  private static getStatus(response: IBookmarkResponse): IBookmarkStatus {
    if (response.ok) {
      return { ok: true, code: ResponseStatusCodes.ok, className: 'success', title: ResponseStatuses.success };
    }

    if ([301, 302].includes(response.status)) {
      return {
        ok: false, code: ResponseStatusCodes.redirected, className: 'redirected',
        title: response.statusText || ResponseStatuses.redirected
      };
    }

    if ([-1, 408].includes(response.status)) {
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

    if ([-3, 401, 402, 403, 405, 407, 422, 429, 451, 423].includes(response.status)) {
      return {
        ok: false, code: ResponseStatusCodes.forbidden, className: 'forbidden',
        title: `${ResponseStatuses.forbidden} [${response.status}]`
      };
    }

    return {
      ok: false, code: ResponseStatusCodes.unsuccessful, className: 'unsuccessful',
      title: `${ResponseStatuses.unsuccessful} [${response.status}]`
    };
  }
}
