import { BookmarkTypes, IBookmarkElement } from 'components/models/bookmark.models';
import { BaseElement } from '../base.component';
import { IBookmarkNode } from 'core';
import { BookmarkManager } from 'services/bookmark-manager.service';


export type IEventListener = (e?: Event) => void;

const template: DocumentFragment = BaseElement.template({
  templateUrl: './bookmark-folder.component.html'
});

export class BookmarkFolderElement extends BaseElement implements IBookmarkElement {
  static readonly selector = 'bookmark-folder';

  readonly type = BookmarkTypes.FOLDER;

  private content: HTMLElement;
  private checkbox: HTMLInputElement;
  private link: HTMLLinkElement;
  // private items: HTMLDivElement;
  private _bookmark: IBookmarkNode;
  private listeners = new Map<'click', IEventListener>();

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.link = this.template.querySelector('[name="link"]');
    this.content = this.template.querySelector('[name="content"]');
    this.checkbox = this.template.querySelector('[name="mark"]');
    // this.items = this.template.querySelector('[name="children"]');
  }

  protected eventListeners(): void {
    this.checkbox.addEventListener('change', () => this.onSelectionChange());
  }

  addEventListener(type: 'click', listener: IEventListener, options?: boolean | AddEventListenerOptions) {
    if (type === 'click') {
      this.listeners.set(type, listener);

      return this.link.addEventListener(type, listener);
    }

    return super.addEventListener(type, listener, options);
  }

  shift(px: number) {
    this.content.style.marginLeft = `${px}px`;
  }

  select() {
    if (!this.checkbox.disabled) {
      this.checkbox.checked = true;
      this.onSelectionChange();
    }
  }

  setBookmark(value: IBookmarkNode) {
    this._bookmark = value;

    this.link.innerText = value.title || 'empty title...';
    this.link.href = `?id=${value.id}`;

    if (!value.title) {
      this.link.classList.add('italic', 'transparent');
    }
  }

  set disabled(value: boolean) {
    this.checkbox.disabled = value;
    super.disabled = value;
  }

  private onSelectionChange() {
    if (this.checkbox.checked) {
      BookmarkManager.select(this._bookmark);
    } else {
      BookmarkManager.unselect(this._bookmark.id);
    }
  }
}
