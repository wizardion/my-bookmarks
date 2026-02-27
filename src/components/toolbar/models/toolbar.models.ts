import { PaginationElement } from 'components/pagination/pagination.component';


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
