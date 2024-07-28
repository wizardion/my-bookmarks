import {
  BookmarkTypes, IBookmarkElement, IBookmarkResponse,
  IBookmarkStatus, STATUSES
} from 'components/models/bookmark.models';
import { BaseElement } from '../base/base.component';
import { delay, IBookmarkNode } from 'core';
import { BookmarkManager } from 'services/bookmark-manager.service';
import { SettingsService } from 'services/settings.service';
import { BookmarkControlsElement } from 'components/bookmark-controls/bookmark-controls';


const template: DocumentFragment = BaseElement.template({
  templateUrl: './bookmark.component.html'
});

export class BookmarkElement extends BaseElement implements IBookmarkElement {
  static readonly selector = 'bookmark-item';

  readonly type = BookmarkTypes.LINK;

  private controller?: AbortController;
  private content: HTMLElement;
  private link: HTMLLinkElement;
  private controls: BookmarkControlsElement;
  private _bookmark: IBookmarkNode;
  private _valid: boolean;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.link = this.template.querySelector('[name="link"]');
    this.content = this.template.querySelector('[name="content"]');
    this.controls = this.template.querySelector('[name="controls"]');
  }

  protected eventListeners(): void {
    this.controls.sync.addEventListener('click', () => this.checkBookmark());
    this.controls.checkbox.addEventListener('change', () => this.onSelectionChange());
  }

  shift(px: number) {
    this.content.style.marginLeft = `${px}px`;
  }

  abort() {
    this.controller?.abort();
  }

  reset() {
    this.controls.reset;
  }

  select() {
    if (!this.controls.checkbox.disabled) {
      this.controls.checkbox.checked = true;
      this.onSelectionChange();
    }
  }

  unselect() {
    this.controls.checkbox.checked = false;
  }

  async checkBookmark(timeout?: number) {
    if (!this.controls.sync.disabled) {
      const settings = timeout ? null : await SettingsService.get();

      this.controls.sync.disabled = true;
      this.controls.animating = true;

      const response = await this.requestURL(this._bookmark.url, (timeout || settings.timeout) * 1000);

      this.controls.animating = false;
      this.controls.status = this.getStatus(response);
      this._valid = response.ok;
    }
  }

  setBookmark(value: IBookmarkNode) {
    this._bookmark = value;

    this.link.innerText = value.title || 'empty title...';
    this.link.href = value.url || '#';

    if (!value.title) {
      this.link.classList.add('italic', 'transparent');
    }
  }

  set disabled(value: boolean) {
    this.controls.checkbox.disabled = value;
    super.disabled = value;
  }

  get valid(): boolean {
    return this._valid;
  }

  private onSelectionChange() {
    if (this.controls.checkbox.checked) {
      BookmarkManager.select(this._bookmark);
    } else {
      BookmarkManager.unselect(this._bookmark.id);
    }
  }

  private async requestURL(url: string, timeout: number): Promise<IBookmarkResponse> {
    if (url.match(/^chrome/g,)) {
      await delay(500);

      return { ok: false, status: -3, statusText: 'Scheme "chrome" is not supported.' };
    }

    try {
      this.controller = new AbortController();
      const id = setTimeout(() => this.controller.abort('timeout'), timeout);
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        mode: 'cors',
        signal: this.controller.signal,
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Cache': 'no-cache'
        }),
      });

      this.controller = null;
      clearTimeout(id);

      return { ok: response.ok, status: response.status, statusText: response.statusText };
    } catch (error) {
      return { ok: false, status: error === 'timeout' ? -1 : -2, statusText: 'Failed to request URL' };
    } finally {
      await delay(500);
    }
  }

  private getStatus(response: IBookmarkResponse): IBookmarkStatus {
    if (response.ok) {
      return { class: 'success', title: STATUSES.success };
    }

    if (response.status === -3) {
      return { class: 'forbidden', title: response.statusText || STATUSES.unsuccessful };
    }

    if (response.status === -1) {
      return { class: 'unsuccessful', title: STATUSES.timeout };
    }

    if (response.status > 499) {
      return { class: 'error', title: STATUSES.error };
    }

    if ([401, 402, 403, 405, 406, 407, 422, 423, 429, 451].includes(response.status)) {
      return { class: 'forbidden', title: STATUSES.forbidden };
    }

    return { class: 'unsuccessful', title: STATUSES.unsuccessful };
  }

  // private async setFavicon(url: string) {
  //   const matches = url.match(domainRegex);
  // const domainRegex = /^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/im;

  //   if (matches) {
  //     const domain = matches[0];
  //     const iconURL = encodeURI(`https://www.google.com/s2/favicons?domain=${domain}&sz=32`);

  //     try {
  //       const response = await fetch(iconURL);

  //       console.log([domain]);

  //       if (response.ok) {
  //         this.icon.style.backgroundImage = `url("${iconURL}")`;
  //         this.content.classList.add('favicon');
  //       }
  //     } catch (error) {
  //       console.log('e', error);
  //     }
  //   }
  // }
}
