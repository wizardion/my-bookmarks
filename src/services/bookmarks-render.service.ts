import { BookmarkElement } from 'components/bookmark/bookmark.component';
import { BookmarkFolderElement } from 'components/bookmark-folder/bookmark-folder.component';
import { BookmarkTypes } from 'components/models/bookmark.models';
import { IBookmarkNode } from 'core';


export class BookmarkRender {
  static levelId: string;
  static recursive: boolean;
  static content: HTMLDivElement;
  static bookmarks: BookmarkElement[] = [];

  public static async render() {
    const bookmarks = await chrome.bookmarks.getChildren(this.levelId);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < bookmarks.length; i++) {
      const item = bookmarks[i];

      await BookmarkRender.renderLevel(item, fragment);
    }

    this.clear();
    this.content.appendChild(fragment);
  }

  public static async clear() {
    this.content.innerHTML = '';
  }

  private static async renderLevel(item: IBookmarkNode, content: DocumentFragment | HTMLElement, level = 0) {
    const line = document.createElement('div');
    const bookmark = item.url ? BookmarkRender.renderBookmark(item) : BookmarkRender.renderFolder(item);

    bookmark.shift(level * 20);
    line.classList.add('bookmark-line');
    line.appendChild(bookmark);
    content.appendChild(line);

    if (bookmark.type === BookmarkTypes.LINK) {
      this.bookmarks.push(bookmark);
    }

    if (this.recursive && bookmark.type === BookmarkTypes.FOLDER) {
      const children = await chrome.bookmarks.getChildren(item.id);

      for (let j = 0; j < children.length; j++) {
        const element = children[j];

        await this.renderLevel(element, content, level + 1);
      }
    }

    return line;
  }

  private static renderFolder(node: chrome.bookmarks.BookmarkTreeNode): BookmarkFolderElement {
    const item = document.createElement(BookmarkFolderElement.selector) as BookmarkFolderElement;

    item.setBookmark(node);

    return item;
  }

  private static renderBookmark(node: IBookmarkNode): BookmarkElement {
    const item = document.createElement(BookmarkElement.selector) as BookmarkElement;

    item.setBookmark(node);

    return item;
  }
}
