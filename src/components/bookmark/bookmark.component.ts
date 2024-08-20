import { IBookmarkElement } from 'components/models/bookmark.models';
import { BaseElement } from '../base/base.component';
import { BookmarkTypes, IBookmarkStatus, ResponseStatuses } from 'core';
import { BookmarkManagerService } from 'services/bookmark-manager.service';


const template: DocumentFragment = BaseElement.template({
  templateUrl: './bookmark.component.html'
});

export class BookmarkElement extends BaseElement implements IBookmarkElement {
  static readonly selector = 'bookmark-item';

  readonly type = BookmarkTypes.LINK;

  private content: HTMLElement;
  private link: HTMLLinkElement;
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
  }

  protected eventListeners(): void {
    this.status.addEventListener('click', () => this.checkBookmark());
    this.checkbox.addEventListener('change', () => this.onSelectionChange());
  }

  shift(px: number) {
    this.content.style.marginLeft = `${px}px`;
  }

  reset() {
    this.status.classList.remove(...Object.keys(ResponseStatuses));
  }

  select(value: boolean = true) {
    if (!this.checkbox.disabled) {
      this.checkbox.checked = value;
      this.onSelectionChange();
    }
  }

  setStatus(value?: IBookmarkStatus): void {
    if (value) {
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

  async checkBookmark(): Promise<IBookmarkStatus | null> {
    if (!this.status.disabled) {
      this.status.disabled = true;
      this.startAnimations();

      const response = await BookmarkManagerService.checkUrl(this._url);

      this.setStatus(response);
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
    if (this.checkbox.checked) {
      BookmarkManagerService.select(Number(this.id));
    } else {
      BookmarkManagerService.unselect(Number(this.id));
    }
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
