import { IBookmarkNode } from 'core';


export interface IBookmarkElement extends HTMLElement {
  type: BookmarkTypes;

  select(): void;
  shift(px: number): void;

  setBookmark(value: IBookmarkNode): void;
}

export interface IBookmarkResponse {
  ok: boolean;
  status: number;
  statusText: string;
}

export type IStatusType = 'success' | 'forbidden' | 'timeout' | 'unsuccessful' | 'error';

export interface IBookmarkStatus {
  class: IStatusType;
  title: string;
}

export enum STATUSES {
  success = 'OK',
  timeout = 'Request timed out',
  unsuccessful = 'Not successful',
  forbidden = 'Forbidden, please check manually',
  error = 'Server error, please check later',
}

export enum BookmarkTypes {
  FOLDER = 0,
  LINK = 1
}
