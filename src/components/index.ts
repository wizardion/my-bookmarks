import { BookmarkElement } from './bookmark/bookmark.component';
import { BookmarkFolderElement } from './bookmark-folder/bookmark-folder.component';
import { BookmarkToolbarElement } from './toolbar/toolbar.component';
import { PaginationElement } from './pagination/pagination.component';
import { DialogElement } from 'components/dialog/dialog.component';


export function whenDefined(): Promise<CustomElementConstructor[]> {
  customElements.define(BookmarkElement.selector, BookmarkElement);
  customElements.define(PaginationElement.selector, PaginationElement);
  customElements.define(BookmarkFolderElement.selector, BookmarkFolderElement);
  customElements.define(BookmarkToolbarElement.selector, BookmarkToolbarElement);
  customElements.define(DialogElement.selector, DialogElement);

  return Promise.all([
    customElements.whenDefined(BookmarkElement.selector),
    customElements.whenDefined(PaginationElement.selector),
    customElements.whenDefined(BookmarkFolderElement.selector),
    customElements.whenDefined(BookmarkToolbarElement.selector),
    customElements.whenDefined(DialogElement.selector)
  ]);
}
