export interface IBookmarkForm {
  controls: {
    sync: {
      button: HTMLButtonElement;
      icons: Record<string, SVGAElement>;
    };
    delete: HTMLButtonElement;
  },
  bookmark: HTMLElement;
  link: HTMLLinkElement;
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

