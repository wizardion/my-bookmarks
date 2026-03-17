import './assets/styles/bookmark-folder.scss';

import {
  IBookmarkElement, BookmarkSelectionDetails
} from 'components/models/bookmark.models';
import { BaseElement } from '../base/base.component';
import { BookmarkTypes, StatusCodes } from 'services/indexed-db/models/db.enums';
import { IBookmarkLevel, IStatusDetails } from 'services/indexed-db/models/db.models';
import { IURLResponseStatus } from 'services/url/models/url.models';
import { UrlService } from 'services/url/url.service';


const template: DocumentFragment = BaseElement.template({
  templateUrl: './bookmark-folder.component.html'
});

export class BookmarkFolderElement extends BaseElement implements IBookmarkElement {
  static readonly selector = 'bookmark-folder';

  readonly type = BookmarkTypes.FOLDER;

  private content: HTMLElement;
  private folders: HTMLElement;
  private link: HTMLLinkElement;
  private checkbox: HTMLInputElement;
  private status: IStatusDetails;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.link = this.template.querySelector('[name="link"]');
    this.content = this.template.querySelector('[name="content"]');
    this.checkbox = this.template.querySelector('[name="select"]');
    this.folders = this.template.querySelector('[name="path"]') as HTMLElement;

    this.link.addEventListener('click', (event) => this.navigateURL(event));
  }

  protected eventListeners(): void {
    this.checkbox.addEventListener('change', (e) => this.onSelectionChange(e));
  }

  shift(px: number) {
    this.content.style.marginLeft = `${px}px`;
  }

  setSelection(value: boolean = true) {
    this.checkbox.checked = value;
  }

  setFocus(value: 'checkbox' | 'status'): void {
    if (value === 'checkbox') {
      this.checkbox.focus();
    }
  }

  abort(): void {
    throw new Error('Method not implemented.');
  }

  reset(): void {
    throw new Error('Method not implemented.');
  }

  setStatus(status: IStatusDetails) {
    this.status = status;
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

  async checkBookmark(): Promise<IURLResponseStatus> {
    return Promise.resolve({
      ok: true,
      code: StatusCodes.ok,
      className: 'success',
      title: ''
    });
  }

  set disabled(value: boolean) {
    this.checkbox.disabled = value;
    super.disabled = value;
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
  }

  set selected(value: boolean) {
    this.checkbox.checked = value;
  }

  get selected(): boolean {
    return this.checkbox.checked;
  }

  set open(value: boolean) {
    if (value) {
      this.classList.add('open');
    } else {
      this.classList.remove('open');
    }
  }

  private async onSelectionChange(e: Event) {
    const selectEvent = new CustomEvent<BookmarkSelectionDetails>(
      'bookmark-selection-change',
      {
        bubbles: true, // Crucial: allows the event to travel up to the container
        composed: true, // Allows the event to cross the Shadow DOM boundary
        detail: {
          id: Number(this.id),
          selected: this.checkbox.checked,
          type: this.type,
          originalEvent: e
        }
      });

    this.dispatchEvent(selectEvent);
  }

  private navigateURL(event: Event) {
    event.preventDefault();

    UrlService.set({ id: Number(this.id), page: null });
  }
}
