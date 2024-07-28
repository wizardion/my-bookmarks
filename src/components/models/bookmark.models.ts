import { IBookmarkNode } from 'core';


export interface IBookmarkElement extends HTMLElement {
  type: BookmarkTypes;

  select(): void;
  shift(px: number): void;

  setBookmark(value: IBookmarkNode): void;
}

export enum BookmarkTypes {
  FOLDER = 0,
  LINK = 1
}
