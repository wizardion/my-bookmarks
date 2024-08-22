import './assets/styles/bookmark-folder.scss';

import { IBookmarkElement } from 'components/models/bookmark.models';
import { BaseElement } from '../base/base.component';
import { BookmarkManagerService } from 'services/bookmark-manager.service';
import { BookmarkTypes, IBookmarkStatus } from 'core';
import { BookmarkRenderService } from 'services/bookmarks-render.service';


const template: DocumentFragment = BaseElement.template({
  templateUrl: './bookmark-folder.component.html'
});

export class BookmarkFolderElement extends BaseElement implements IBookmarkElement {
  static readonly selector = 'bookmark-folder';

  readonly type = BookmarkTypes.FOLDER;

  private content: HTMLElement;
  private link: HTMLLinkElement;
  private checkbox: HTMLInputElement;
  private status: IBookmarkStatus;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.link = this.template.querySelector('[name="link"]');
    this.content = this.template.querySelector('[name="content"]');
    this.checkbox = this.template.querySelector('[name="select"]');
  }

  protected eventListeners(): void {
    this.checkbox.addEventListener('change', () => this.onSelectionChange());
  }

  shift(px: number) {
    this.content.style.marginLeft = `${px}px`;
  }

  select(value: boolean = true) {
    if (!this.checkbox.disabled) {
      this.checkbox.checked = value;
      this.onSelectionChange();
    }
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

  setStatus(status: IBookmarkStatus) {
    this.status = status;
  }

  async checkBookmark(): Promise<IBookmarkStatus> {
    return Promise.resolve(this.status);
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

  private async onSelectionChange() {
    const checked = this.checkbox.checked;
    const tree = await chrome.bookmarks.getSubTree(this.id);

    if (this.checkbox.checked) {
      BookmarkManagerService.select(Number(this.id));
    } else {
      BookmarkManagerService.unselect(Number(this.id));
    }

    if (BookmarkRenderService.recursive) {
      this.setSelection(tree, checked);
    }
  }

  private setSelection(items: chrome.bookmarks.BookmarkTreeNode[], checked: boolean, level = 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const element = document.getElementById(item.id) as IBookmarkElement;

      if (checked) {
        BookmarkManagerService.select(Number(item.id));
      } else {
        BookmarkManagerService.unselect(Number(item.id));
      }

      if (element) {
        element.selected = checked;
      }

      if (item.children) {
        this.setSelection(item.children, checked, level + 1);
      }
    }
  }
}
