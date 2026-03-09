import { StatusCodes } from "services/indexed-db/models/db.enums";
import { StatusMessages } from "./url.enums";

export type IResponseClassName =
  | 'lost'
  | 'error'
  | 'success'
  | 'timeout'
  | 'forbidden'
  | 'redirected'
  | 'unsuccessful'
  | null;

export interface IHttpStatus {
  ok: boolean;
  status: number;
  statusText: string;
}

export interface IURLResponseStatus {
  ok: boolean;
  code: StatusCodes;
  className: IResponseClassName;
  title: StatusMessages | string;
}