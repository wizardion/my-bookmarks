import { PaginationElement } from 'components/pagination/pagination.component';


export interface IToolbarForm {
  check: HTMLButtonElement;
  cancel: HTMLButtonElement;
  remove: HTMLButtonElement;
  removeCount: HTMLElement;
  expand: HTMLInputElement;
  timeout: HTMLInputElement;
  timeoutText: HTMLSpanElement;
  progressBar: HTMLDivElement;
  pagination: PaginationElement;
}
