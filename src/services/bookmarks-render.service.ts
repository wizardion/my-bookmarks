import { BookmarkElement } from 'components/bookmark/bookmark.component';
import { BookmarkFolderElement } from 'components/bookmark-folder/bookmark-folder.component';
import { BookmarkManagerService } from 'services/bookmark-manager.service';
import { IBookmarkNode } from 'core';
import { IBookmarkElement } from 'components/models/bookmark.models';


export class BookmarkRenderService {
  static levelId: string;
  static recursive: boolean;
  static content: HTMLDivElement;
  static items = new Map<number, IBookmarkNode>();

  static start: number = 0;
  static count: number = 0;
  static total: number = 0;

  public static async render(rebind?: boolean) {
    const data = await BookmarkManagerService.loadData(this.levelId, this.start, this.count, this.recursive, rebind);

    this.total = BookmarkManagerService.bookmarks.size;
    this.items.clear();

    if (data.length) {
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < data.length; i++) {
        const node = data[i];
        const line = document.createElement('div');
        const bookmark = node.url ? this.renderBookmark(node) : this.renderFolder(node);

        bookmark.shift(node.level * 20);
        line.classList.add('bookmark-line');
        line.appendChild(bookmark);

        fragment.appendChild(line);
        this.items.set(node.id, node);
      }

      this.clear();
      this.content.appendChild(fragment);
    } else {
      this.clear('<i class="mute margin-left">No bookmarks here.</i>');
    }

    window.dispatchEvent(new CustomEvent<number>('rendered', { detail: this.total }));
  }

  public static async clear(message: string = '') {
    this.content.innerHTML = message;
  }

  public static async getSize(): Promise<number> {
    const data = await BookmarkManagerService.loadData(this.levelId, this.start, this.count, this.recursive);

    return data?.length || 0;
  }

  public static disableItems(value: boolean = true) {
    this.items.forEach((item) => {
      const element = document.getElementById(item.id.toString()) as IBookmarkElement;

      if (element) {
        element.disabled = value;
      }
    });
  }

  private static renderFolder(node: IBookmarkNode): BookmarkFolderElement {
    const item = document.createElement(BookmarkFolderElement.selector) as BookmarkFolderElement;

    item.id = node.id.toString();
    item.url = `?id=${item.id}`;
    item.title = node.title;
    item.selected = node.selected;
    item.open = this.recursive;
    item.setStatus(node.status);

    return item;
  }

  private static renderBookmark(node: IBookmarkNode): BookmarkElement {
    const item = document.createElement(BookmarkElement.selector) as BookmarkElement;

    item.id = node.id.toString();
    item.url = node.url;
    item.title = node.title;
    item.selected = node.selected;
    item.setStatus(node.status);

    return item;
  }
}
