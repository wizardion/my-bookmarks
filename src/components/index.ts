import { BookmarkElement } from './bookmark/bookmark.component';
import { BookmarkFolderElement } from './bookmark-folder/bookmark-folder.component';
import { BookmarkToolbarElement } from './toolbar/toolbar.component';
import { BookmarkControlsElement } from './bookmark-controls/bookmark-controls';


export function whenDefined(): Promise<CustomElementConstructor[]> {
  customElements.define(BookmarkElement.selector, BookmarkElement);
  customElements.define(BookmarkFolderElement.selector, BookmarkFolderElement);
  customElements.define(BookmarkToolbarElement.selector, BookmarkToolbarElement);
  customElements.define(BookmarkControlsElement.selector, BookmarkControlsElement);

  return Promise.all([
    customElements.whenDefined(BookmarkElement.selector),
    customElements.whenDefined(BookmarkFolderElement.selector),
    customElements.whenDefined(BookmarkToolbarElement.selector),
    customElements.whenDefined(BookmarkControlsElement.selector)
  ]);
}
