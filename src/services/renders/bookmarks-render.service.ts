import {
  BookmarkFolderElement
} from 'components/bookmark-folder/bookmark-folder.component';
import { BookmarkElement } from 'components/bookmark/bookmark.component';
import { BookmarksService } from 'services/bookmarks/bookmarks.service';
import { IBookmarkNode } from 'services/indexed-db/models/db.models';
import { DEFAULT_FILTERS } from './utils/bookmark.constant';
import { IBookmarksFilters, BookmarkRenderEventMap } from './models/bookmarks.models';
import { IndexedDBManager } from 'services/indexed-db/bookmark-manager.service';
import { nextFrame } from 'core';
import { IBookmarkElement } from 'components/models/bookmark.models';
import { SelectionManager } from './selection-manager.service';

const BATCH_SIZE = 50; // Render 50 items at a time to keep 60fps

export class BookmarkRenderService {
  public static filters: IBookmarksFilters = DEFAULT_FILTERS;
  public static selection = new Set<number>();

  static levelId: number;
  static content: HTMLElement;

  public static init(content: HTMLElement) {
    this.content = content;

    // This listener is created ONCE for the entire lifecycle of the app
    this.content.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLElement;

      console.log('change.target', target);

      // Use a selector to identify the checkbox inside your Custom Element
      if (target.classList.contains('bookmark-checkbox')) {
        // Find the custom element parent to get the ID
        const bookmarkItem = (
          target.closest('bookmark-item') || target.closest('bookmark-folder')
        ) as IBookmarkElement;

        if (bookmarkItem) {
          const id = Number(bookmarkItem.id);
          const isSelected = (target as HTMLInputElement).checked;

          SelectionManager.toggle(id, isSelected);
        }
      }
    });
  }

  public static async countItems(): Promise<number> {
    const service = new BookmarksService(new IndexedDBManager());

    return service.getChildrenCount(this.levelId, this.filters.recursive);
  }

  public static async render() {
    const service = new BookmarksService(new IndexedDBManager());

    // 1. Initial Pagination & Total
    const total = await service.getChildrenCount(this.levelId, this.filters.recursive);
    const startOffset = (this.filters.page - 1) * this.filters.itemsPerPage;
    const pageLimit = Math.min(this.filters.itemsPerPage, total - startOffset);

    if (total === 0 || pageLimit <= 0) {
      this.clear('No bookmarks here.');

      await nextFrame();
      this.dispatchEvent('render-complete', 0);
    }

    const fragment = document.createDocumentFragment();
    const firstChildren = await service.getChildren(
      this.levelId, this.filters.recursive, startOffset, Math.min(BATCH_SIZE, pageLimit)
    );

    for (let i = 0; i < firstChildren.length; i++) {
      fragment.appendChild(this.createBookmarkLine(firstChildren[i]));
    }

    this.empty();
    this.content.appendChild(fragment);
    let totalRendered = firstChildren.length;

    await nextFrame();

    if (firstChildren.length < pageLimit) {
      const remainingChildren = await service.getChildren(
        this.levelId,
        this.filters.recursive,
        startOffset + firstChildren.length,
        pageLimit - firstChildren.length
      );

      await this.streamToDOM(remainingChildren);
      totalRendered += remainingChildren.length;
    }

    this.dispatchEvent('render-complete', totalRendered);
  }

  public static async clear(message: string) {
    this.content.innerHTML = `<i class="mute margin-left">${message}</i>`;
  }

  public static async empty() {
    this.content.innerHTML = '';
  }

  public static disableItems(value: boolean = true) {
    const folders = this.content.querySelectorAll<BookmarkFolderElement>(
      BookmarkFolderElement.selector,
    );
    const items = this.content.querySelectorAll<BookmarkElement>(
      BookmarkElement.selector,
    );

    items.forEach(i => i.disabled = value);
    folders.forEach(i => i.disabled = value);
  }

  private static streamToDOM(items: IBookmarkNode[]): Promise<void> {
    let processedCount = 0;

    const renderBatch = async () => {
      const fragment = document.createDocumentFragment();
      const end = Math.min(processedCount + BATCH_SIZE, items.length);

      for (let i = processedCount; i < end; i++) {
        fragment.appendChild(this.createBookmarkLine(items[i]));
      }

      this.content.appendChild(fragment);
      processedCount = end;

      await nextFrame();

      if (processedCount < items.length) {
        await renderBatch();
      }
    };

    return renderBatch();
  }

  private static createBookmarkLine(node: IBookmarkNode): HTMLElement {
    const line = document.createElement('div');
    const content = node.url ? this.renderBookmark(node) : this.renderFolder(node);

    line.classList.add('bookmark-line');

    if (!this.filters.unsuccessfulOnly) {
      const depth = Math.max(node.levels?.length - 1, 0) || 0;

      if (this.filters.recursive && !this.filters.unsuccessfulOnly) {
        content.shift(depth * 20);
      }
    }

    line.appendChild(content);

    return line;
  }

  private static renderFolder(node: IBookmarkNode): IBookmarkElement {
    const item = (
      document.createElement(BookmarkFolderElement.selector) as BookmarkFolderElement
    );

    item.id = node.id.toString();
    item.url = `?id=${item.id}`;
    item.title = node.title;
    item.selected = this.selection.has(node.id);
    item.open = this.filters.recursive;

    item.setStatus(node.statusDetails);
    item.showPath(node.levels);

    return item;
  }

  private static renderBookmark(node: IBookmarkNode): IBookmarkElement {
    const item = document.createElement(BookmarkElement.selector) as BookmarkElement;

    item.id = node.id.toString();
    item.url = node.url;
    item.title = node.title;
    item.selected = this.selection.has(node.id);

    item.setStatus(node.statusDetails);
    item.showPath(node.levels);

    return item;
  }

  /**
  * Centralized notification method
  */
  private static dispatchEvent<K extends keyof BookmarkRenderEventMap>(
    eventName: K,
    detail: BookmarkRenderEventMap[K] extends CustomEvent<infer D> ? D : never
  ) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}
