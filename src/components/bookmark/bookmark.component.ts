import { IBookmarkElement } from 'components/models/bookmark.models';
import { BaseElement } from '../base/base.component';
import { BookmarkTypes } from 'services/indexed-db/models/db.enums';
import { IBookmarkLevel, IStatusDetails } from 'services/indexed-db/models/db.models';
import { UrlChecker } from 'services/url/url-checker.service';
import { IURLResponseStatus } from 'services/url/models/url.models';


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
  private _url: string;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.link = this.template.querySelector('[name="link"]');
    this.content = this.template.querySelector('[name="content"]');
    this.checkbox = this.template.querySelector('[name="select"]');
    this.status = this.template.querySelector('[name="status"]');
    this.folders = this.template.querySelector('[name="path"]') as HTMLElement;
  }

  protected eventListeners(): void {
    this.status.addEventListener('click', () => this.checkBookmark());
    this.checkbox.addEventListener('change', () => this.onSelectionChange());
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

  set path(value: string) {
    this.link.innerText = `[${value}] ${this.link.innerText}`;
  }

  set url(value: string) {
    this.link.href = value;
    this._url = value;
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

  private onSelectionChange() {
    // BookmarksAPIManager.setSelection(Number(this.id), this.checkbox.checked);
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
}
