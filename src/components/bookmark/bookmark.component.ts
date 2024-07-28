import './assets/styles/bookmark-controls.scss';

import { BookmarkTypes, IBookmarkElement } from 'components/models/bookmark.models';
import { IBookmarkResponse, IBookmarkStatus, STATUSES } from './models/bookmark.models';
import { BaseElement } from '../base.component';
import { delay, IBookmarkNode } from 'core';
import { BookmarkManager } from 'services/bookmark-manager.service';


const template: DocumentFragment = BaseElement.template({
  templateUrl: './bookmark.component.html'
});
// const domainRegex = /^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/im;

export class BookmarkElement extends BaseElement implements IBookmarkElement {
  static readonly selector = 'bookmark-item';

  readonly type = BookmarkTypes.LINK;

  // private icon: HTMLElement;
  private controller?: AbortController;
  private content: HTMLElement;
  private link: HTMLLinkElement;
  private status: HTMLButtonElement;
  private checkbox: HTMLInputElement;
  private _bookmark: IBookmarkNode;
  private _timeout: number = 5000;
  private _valid: boolean;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.link = this.template.querySelector('[name="link"]');
    this.content = this.template.querySelector('[name="content"]');
    this.status = this.template.querySelector('[name="status"]');
    this.checkbox = this.template.querySelector('[name="mark"]');
    // this.icon = this.template.querySelector('[name="icon"]');
  }

  protected eventListeners(): void {
    this.status.addEventListener('click', () => this.checkBookmark());
    this.checkbox.addEventListener('change', () => this.onSelectionChange());
  }

  shift(px: number) {
    this.content.style.marginLeft = `${px}px`;
  }

  abort() {
    this.controller?.abort();
  }

  reset() {
    this.status.classList.remove(...Object.keys(STATUSES));
  }

  select() {
    if (!this.checkbox.disabled) {
      this.checkbox.checked = true;
      this.onSelectionChange();
    }
  }

  unselect() {
    this.checkbox.checked = false;
  }

  async checkBookmark() {
    if (!this.status.disabled) {
      this.status.disabled = true;
      this.reset();
      this.startAnimations(this.status.getElementsByTagName('animate'));

      const response = await this.requestURL(this._bookmark.url);
      const status = this.getStatus(response);

      this.stopAnimations(this.status.getElementsByTagName('animate'));
      this.status.classList.toggle(status.class);
      this.status.setAttribute('title', status.title);
      this.status.disabled = false;
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

    // if (value.url) {
    //   this.setFavicon(value.url);
    // }
  }

  set timeout(value: number) {
    this._timeout = value;
  }

  set disabled(value: boolean) {
    this.checkbox.disabled = value;
    super.disabled = value;
  }

  get valid(): boolean {
    return this._valid;
  }

  private onSelectionChange() {
    if (this.checkbox.checked) {
      BookmarkManager.select(this._bookmark);
    } else {
      BookmarkManager.unselect(this._bookmark.id);
    }
  }

  private async requestURL(url: string): Promise<IBookmarkResponse> {
    if (url.match(/^chrome/g,)) {
      return { ok: false, status: -3, statusText: 'Scheme "chrome" is not supported.' };
    }

    try {
      this.controller = new AbortController();
      const id = setTimeout(() => this.controller.abort('timeout'), this._timeout);
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

  private startAnimations(animateElements: HTMLCollectionOf<SVGAnimateElement>) {
    for (let i = 0; i < animateElements.length; i++) {
      const element = animateElements.item(i);

      element.beginElement();
    }
  }

  private stopAnimations(animateElements: HTMLCollectionOf<SVGAnimateElement>) {
    for (let i = 0; i < animateElements.length; i++) {
      const element = animateElements.item(i);

      element.endElement();
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
