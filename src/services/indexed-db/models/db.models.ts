import { DBSchema } from 'idb';
import { BookmarkTypes, StatusCodes } from './db.enums';

export interface IBookmarkLevel {
  id: string;
  title: string;
}

export interface IStatusDetails {
  className: string;
  title: string | null;
}

export interface IBookmarkNode {
  id: number;
  parentId: number | null;
  title: string | null;
  url: string | null;
  level: number;
  levels: IBookmarkLevel[];
  type: BookmarkTypes;
  selected: boolean;
  code: StatusCodes;
  index: number;
  created: number;
  statusDetails?: IStatusDetails;
}

export type BookmarkDBIndexTypes =
  | 'by-parent-id'
  | 'by-type'
  | 'by-code'
  | 'by-title'
  | 'by-order'
  | 'by-created';


export interface IBookmarkDB extends DBSchema {
  bookmarks: {
    key: number;
    value: IBookmarkNode;
    indexes: {
      'by-parent-id': number;
      'by-type': number;
      'by-code': number;
      'by-title': string;

      'by-order': number;
      'by-created': number;
    };
  };
}
