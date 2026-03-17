import { IBookmarkElement } from 'components/models/bookmark.models';
import { BaseElement } from '../base/base.component';
import { BookmarkTypes } from 'services/indexed-db/models/db.enums';
import { IBookmarkLevel, IStatusDetails } from 'services/indexed-db/models/db.models';
import { UrlChecker } from 'services/url/url-checker.service';
import { IURLResponseStatus } from 'services/url/models/url.models';
import { UrlService } from 'services/url/url.service';

const template: DocumentFragment = BaseElement.template({
  templateUrl: './bookmark.component.html'
});

export class BookmarkElement extends BaseElement implements IBookmarkElement {
  static readonly selector = 'bookmark-item';

  readonly type = BookmarkTypes.LINK;

  private content: HTMLElement;
  private link: HTMLLinkElement;
  private folders: HTMLElement;
  private checkbox: HTMLInputElement;
  private status: HTMLInputElement;
  private favicon: SVGImageElement;
  private icon: SVGPathElement;
  private _url: string;

  // private listeners = new Map<string, IEventListener[]>();

  constructor() {
    super();

    this.template = <HTMLElement>template.cloneNode(true);
    const svg = this.template.querySelector('[name="icon"]');

    this.link = this.template.querySelector('[name="link"]');
    this.content = this.template.querySelector('[name="content"]');
    this.checkbox = this.template.querySelector('[name="select"]');
    this.status = this.template.querySelector('[name="status"]');
    this.folders = this.template.querySelector('[name="path"]') as HTMLElement;

    this.icon = svg.firstElementChild as SVGPathElement;
    this.favicon = svg.lastElementChild as SVGImageElement;
  }

  protected eventListeners(): void {
    this.status.addEventListener('click', () => this.checkBookmark());
    this.favicon.addEventListener('error', () => this.onFaviconError());
    this.favicon.addEventListener('load', () => this.onFaviconLoaded());
  }

  shift(px: number) {
    this.content.style.marginLeft = `${px}px`;
  }

  reset() {
    // this.status.classList.remove(...Object.keys(StatusMessages));
  }

  setSelection(value: boolean = true) {
    this.checkbox.checked = value;
  }

  setStatus(value?: IStatusDetails): void {
    if (value?.className) {
      this.status.classList.toggle(value.className);
      this.status.setAttribute('title', value.title);
      this.status.disabled = false;
    } else {
      this.reset();
    }
  }

  setFocus(value: 'checkbox' | 'status'): void {
    if (value === 'checkbox') {
      this.checkbox.focus();
    }
  }

  showPath(value: IBookmarkLevel[]) {
    for (const level of value) {
      const element = document.createElement('a');

      element.href = `?id=${level.id}`;
      element.innerText = level.title;
      element.dataset['id'] = level.id;
      element.addEventListener('click', (event) => this.navigateURL(event));

      this.folders.appendChild(element);
    }

    this.folders.hidden = value.length === 0;
  }

  async checkBookmark(): Promise<IURLResponseStatus | null> {
    if (!this.status.disabled) {
      this.status.disabled = true;
      this.startAnimations();

      const response = await UrlChecker.checkUrl(this._url);

      this.setStatus({ className: response.className, title: response.title });
      this.stopAnimations();
      this.status.disabled = false;

      return response;
    }

    return null;
  }

  set title(value: string) {
    this.link.innerText = value || 'empty title...';

    if (!value) {
      this.link.classList.add('italic', 'transparent');
    }

    super.title = value;
  }

  set url(value: string) {
    this.link.href = value;
    this._url = value;
    this.favicon.setAttribute('href', this.getFaviconURL(value));
  }

  set selected(value: boolean) {
    this.checkbox.checked = value;
  }

  get selected(): boolean {
    return this.checkbox.checked;
  }

  set disabled(value: boolean) {
    this.checkbox.disabled = value;
    this.status.disabled = value;
    super.disabled = value;
  }

  private navigateURL(event: Event) {
    // Prevent the default link behavior (page reload)
    event.preventDefault();

    // Get the target URL from the href attribute
    const id = (event.target as HTMLLinkElement).dataset['id'];

    // Update the URL without reloading using the History API
    // In this simple case, we are just using the href value directly
    UrlService.set({ id: Number(id), page: null });
  }

  private startAnimations() {
    const elements = this.status.getElementsByTagName('animate');

    this.reset();

    for (let i = 0; i < elements.length; i++) {
      const element = elements.item(i);

      element.beginElement();
    }
  }

  private stopAnimations() {
    const elements = this.status.getElementsByTagName('animate');

    for (let i = 0; i < elements.length; i++) {
      const element = elements.item(i);

      element.endElement();
    }
  }

  private getFaviconURL(url: string) {
    const urlParams = new URL(chrome.runtime.getURL('/_favicon/'));

    urlParams.searchParams.set('pageUrl', url);
    urlParams.searchParams.set('size', '32');

    return urlParams.toString();
  }

  private onFaviconLoaded() {
    this.icon.classList.add('hidden');
    this.favicon.classList.remove('hidden');
  }

  private onFaviconError() {
    this.favicon.classList.add('hidden');
    this.icon.classList.remove('hidden');
  }
}
