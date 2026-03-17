import { BookmarkTypes } from 'services/indexed-db/models/db.enums';
import { IStatusDetails } from 'services/indexed-db/models/db.models';
import { IURLResponseStatus } from 'services/url/models/url.models';

export interface IBookmarkElement extends HTMLElement {
  type: BookmarkTypes;

  get disabled(): boolean;

  set title(value: string);
  set url(value: string);
  set disabled(value: boolean);
  set selected(value: boolean);

  reset(): void;
  shift(px: number): void;
  setSelection(value?: boolean): void;
  setStatus(value: IStatusDetails): void;
  setFocus(value: 'checkbox' | 'status'): void;
  checkBookmark(): Promise<IURLResponseStatus>;
}

export interface BookmarkSelectionDetails {
  id: number;
  selected: boolean;
  type: BookmarkTypes;
  originalEvent: Event;
}

declare global {
  interface HTMLElementEventMap {
    'bookmark-selection-change': CustomEvent<BookmarkSelectionDetails>;
  }
}

