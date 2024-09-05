import { BookmarkTypes, IBookmarkStatus } from 'core';


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
  setStatus(value: IBookmarkStatus): void;
  setFocus(value: 'checkbox' | 'status'): void;
  checkBookmark(): Promise<IBookmarkStatus>;
}
