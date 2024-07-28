import { BookmarkTypes, IBookmarkElement } from 'components/models/bookmark.models';
import { BaseElement } from '../base/base.component';
import { IBookmarkNode } from 'core';
import { BookmarkManager } from 'services/bookmark-manager.service';
import { BookmarkControlsElement } from 'components/bookmark-controls/bookmark-controls';


export type IEventListener = (e?: Event) => void;

const template: DocumentFragment = BaseElement.template({
  templateUrl: './bookmark-folder.component.html'
});

export class BookmarkFolderElement extends BaseElement implements IBookmarkElement {
  static readonly selector = 'bookmark-folder';

  readonly type = BookmarkTypes.FOLDER;

  private content: HTMLElement;
  private link: HTMLLinkElement;
  private controls: BookmarkControlsElement;
  private _bookmark: IBookmarkNode;
  private listeners = new Map<'click', IEventListener>();

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.link = this.template.querySelector('[name="link"]');
    this.content = this.template.querySelector('[name="content"]');
    this.controls = this.template.querySelector('[name="controls"]');
  }

  protected eventListeners(): void {
    this.controls.checkbox.addEventListener('change', () => this.onSelectionChange());
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
    if (!this.controls.checkbox.disabled) {
      this.controls.checkbox.checked = true;
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
    this.controls.checkbox.disabled = value;
    super.disabled = value;
  }

  private onSelectionChange() {
    if (this.controls.checkbox.checked) {
      BookmarkManager.select(this._bookmark);
    } else {
      BookmarkManager.unselect(this._bookmark.id);
    }
  }
}
