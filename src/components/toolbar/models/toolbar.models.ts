import { PaginationElement } from 'components/pagination/pagination.component';
import { IURLResponseStatus } from 'services/url/models/url.models';


export type IRequestQueue = {
  id: number,
  resolved: boolean,
  url: string,
  promise: Promise<IURLResponseStatus> | null,
  retries: number
}

export interface IToolbarForm {
  check: HTMLButtonElement;
  cancel: HTMLButtonElement;
  remove: HTMLButtonElement;
  removeCount: HTMLElement;
  restCount: HTMLElement;
  checkCount: HTMLElement;
  expand: HTMLInputElement;
  unsuccesfull: HTMLInputElement;
  timeout: HTMLInputElement;
  timeoutText: HTMLSpanElement;
  progressBar: HTMLDivElement;
  pagination: PaginationElement;
}
