import {
  BookmarkFolderElement
} from 'components/bookmark-folder/bookmark-folder.component';
import { BookmarkElement } from 'components/bookmark/bookmark.component';
import { BookmarksService } from 'services/bookmarks/bookmarks.service';
import { IBookmarksFilters } from 'services/bookmarks/models/bookmarks.models';
import { IBookmarkNode } from 'services/indexed-db/models/db.models';


export class BookmarkRenderService {
  static levelId: number;
  static content: HTMLDivElement;

  public static async render() {
    const children = (await BookmarksService.getChildren(this.levelId));
    // .sort((a, b) => {
    //   return a.pathSort.localeCompare(b.pathSort);
    // });

    if (children.length) {
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        const line = document.createElement('div');
        const bookmark = node.url ? this.renderBookmark(node) : this.renderFolder(node);

        if (!this.filters.unsuccessfulOnly) {
          bookmark.shift(Math.max(node.levels.length - 1, 0) * 20);
        }

        line.classList.add('bookmark-line');
        line.appendChild(bookmark);

        fragment.appendChild(line);
        // this.items.set(node.id, node);
      }

      this.empty();
      this.content.appendChild(fragment);
    } else {
      this.clear('No bookmarks here.');
    }

    // window
    // .dispatchEvent(new CustomEvent<number>('rendered', { detail: this.total }));
  }

  public static async clear(message: string) {
    this.content.innerHTML = `<i class="mute margin-left">${message}</i>`;
  }

  public static async empty() {
    this.content.innerHTML = '';
  }

  public static get filters(): IBookmarksFilters {
    return BookmarksService.filters;
  }

  public static get total(): number {
    return BookmarksService.total;
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

  private static renderFolder(node: IBookmarkNode): BookmarkFolderElement {
    const item = (
      document.createElement(BookmarkFolderElement.selector) as BookmarkFolderElement
    );

    item.id = node.id.toString();
    item.url = `?id=${item.id}`;
    item.title = node.title;
    item.selected = node.selected;
    item.open = this.filters.recursive;
    item.path = node.pathSort;

    item.setStatus(node.statusDetails);
    item.showPath(node.levels);

    return item;
  }

  private static renderBookmark(node: IBookmarkNode): BookmarkElement {
    const item = document.createElement(BookmarkElement.selector) as BookmarkElement;

    item.id = node.id.toString();
    item.url = node.url;
    item.title = node.title;
    item.selected = node.selected;
    item.path = node.pathSort;

    item.setStatus(node.statusDetails);
    item.showPath(node.levels);

    return item;
  }
}
