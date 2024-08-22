export type IEventListener = (e?: Event) => void;
export type IResponseType =
  | 'lost'
  | 'error'
  | 'success'
  | 'timeout'
  | 'forbidden'
  | 'redirected'
  | 'unsuccessful';

export interface IBookmarkResponse {
  ok: boolean;
  status: number;
  statusText: string;
}

export enum BookmarkTypes {
  FOLDER = 0,
  LINK = 1
}

export enum ResponseStatuses {
  success = 'OK',
  timeout = 'Request timed out',
  redirected = 'Request was redirected',
  unsuccessful = 'Not successful',
  forbidden = 'Forbidden, please check manually',
  lost = 'Page not found',
  error = 'Server error or site is down, please check later',
}

export enum ResponseStatusCodes {
  ok = 0,
  success = 1,
  timeout = 2,
  redirected = 3,
  unsuccessful = 4,
  forbidden = 5,
  error = 6,
  lost = 7,
}

export interface IBookmarkStatus {
  ok: boolean;
  code: number;
  className: IResponseType;
  title?: string | null;
}

export interface IBookmarkNode {
  id: number;
  title: string | null;
  url: string | null;
  level: number;
  type: BookmarkTypes;
  selected?: boolean;
  status?: IBookmarkStatus
}
