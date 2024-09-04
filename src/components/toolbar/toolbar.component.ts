import './assets/styles/toolbar.component.scss';

import { BaseElement } from '../base/base.component';
import { BookmarkRenderService } from 'services/bookmarks-render.service';
import { IToolbarForm } from './models/toolbar.models';
import { BookmarkManagerService } from 'services/bookmark-manager.service';
import { SettingsService } from 'services/settings.service';
import { IBookmarkElement } from 'components/models/bookmark.models';
import { UrlService } from 'services/url.service';
import { IBookmarkNode, IBookmarkStatus } from 'core/models/core.models';
import { delay, BookmarkTypes } from 'core';
import { DialogElement } from 'components/dialog/dialog.component';
import { ToolbarKeyboardService } from 'services/toolbar-keyboards.service';


const template: DocumentFragment = BaseElement.template({
  templateUrl: './toolbar.component.html'
});

export class BookmarkToolbarElement extends BaseElement {
  static readonly selector = 'bookmark-toolbar';

  public form: IToolbarForm;
  protected processing: boolean;
  protected canceled: boolean;
  protected wakeLock: WakeLockSentinel;
  protected requests: { resolved: boolean, promise: Promise<IBookmarkStatus> }[];

  protected readonly maxRequests: number = 100;

  private timeout: NodeJS.Timeout;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);

    this.form = {
      expand: this.template.querySelector('[name="expand-all"]'),
      check: this.template.querySelector('[name="check-bookmarks"]'),
      cancel: this.template.querySelector('[name="cancel-check"]'),
      remove: this.template.querySelector('[name="remove-bookmarks"]'),
      removeCount: this.template.querySelector('[name="remove-count"]'),
      restCount: this.template.querySelector('[name="rest-count"]'),
      timeout: this.template.querySelector('[name="timeout-range"]'),
      timeoutText: this.template.querySelector('[name="timeout-text"]'),
      progressBar: this.template.querySelector('[name="progress-bar"]'),
      pagination: this.template.querySelector('[name="nav-pagination"]')
    };
  }

  protected async eventListeners() {
    const settings = await SettingsService.get();

    this.form.expand.checked = settings.recursive;
    this.form.timeout.value = settings.timeout.toString();
    this.form.timeoutText.innerText = settings.timeout + ' s';

    this.form.expand.addEventListener('change', () => this.onRecursiveChange());
    this.form.check.addEventListener('click', () => this.checkAllBookmarks());
    this.form.timeout.addEventListener('input', () => this.onTimeoutChange());
    this.form.cancel.addEventListener('click', () => this.cancelRequests());
    this.form.remove.addEventListener('click', () => this.onRemove());

    BookmarkManagerService.timeout = settings.timeout;
    BookmarkManagerService.addEventListener('select', () => this.onSelectionChange());
    window.addEventListener('rendered', () => this.onItemsRendered());
    ToolbarKeyboardService.watch(this);
  }

  protected async checkAllBookmarks() {
    let processed = 0;
    const currentPage = this.form.pagination.page;
    const hasSelection = BookmarkManagerService.selection.size > 0;
    const allItems = hasSelection ? BookmarkManagerService.getSelectedItems() : BookmarkManagerService.getItems();

    this.requests = [];
    await this.startProgress();

    allItems.forEach(s => BookmarkManagerService.bookmarks.get(s.id).status = null);

    for (let i = 1; i <= this.form.pagination.pageCount && processed < allItems.length && !this.canceled; i++) {
      BookmarkRenderService.start = (i - 1) * BookmarkRenderService.count;
      await BookmarkRenderService.render();
      this.form.pagination.setPage(i);
      console.clear();

      const links = Array.from(BookmarkRenderService.items.values()).filter(i => i.type === BookmarkTypes.LINK);
      const items = hasSelection ? links.filter(i => BookmarkManagerService.selection.has(i.id)) : links;

      await this.requestWakeLock();
      await this.checkItems(items, allItems.length, processed);
      processed += items.length;
    }

    await Promise.all(this.requests.filter(i => !i.resolved).map(i => i.promise));
    this.form.restCount.innerText = ``;

    if (!this.canceled) {
      await delay(1000);
    }

    BookmarkRenderService.start = (currentPage - 1) * BookmarkRenderService.count;
    await BookmarkRenderService.render();
    this.form.pagination.setPage(currentPage);
    this.scrollToElement();

    await this.finishProgress();
  }

  protected async checkItems(items: IBookmarkNode[], total: number, processed: number) {
    for (let i = 0; i < items.length && !this.canceled; i++) {
      const item = items[i];
      const element = document.getElementById(item.id.toString()) as IBookmarkElement;
      const request = { resolved: false, promise: element.checkBookmark() };

      this.progress((i + 1) + processed, total);

      this.requests.push(request);
      request.promise
        .then((r) => this.processResult(item.id, r))
        .then(() => request.resolved = true);

      if (this.canceled) {
        break;
      }

      if (this.requests.length >= this.maxRequests) {
        while (this.requests.length > 10) {
          await delay(1000);
          this.requests = this.requests.filter((r) => !r.resolved);
          await this.requestWakeLock();
        }
      }

      if (!this.timeout) {
        this.scrollToElement(element);
      }

      await delay(175);
    }
  }

  set disabled(value: boolean) {
    this.form.expand.disabled = value;
    this.form.check.disabled = value;
    this.form.timeout.disabled = value;
    this.form.pagination.disabled = value;

    super.disabled = value;
  }

  set disabledCheck(value: boolean) {
    this.form.check.disabled = value;
  }

  private processResult(id: number, status: IBookmarkStatus) {
    const item = BookmarkManagerService.bookmarks.get(id);
    const bookmark = document.getElementById(id.toString()) as IBookmarkElement;
    const selected = !status.ok && status.className !== 'forbidden';

    bookmark?.setSelection(selected);
    BookmarkManagerService.setSelection(item.id, selected);

    item.status = status;
    this.form.restCount.innerText = `pending: ${this.requests.filter(i => !i.resolved).length}`;
  }

  private scrollToElement(element?: HTMLElement) {
    if (element) {
      const rect = element.getBoundingClientRect();
      const isInView = (
        rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || element.clientHeight) &&
      rect.right <= (window.innerWidth || element.clientWidth)
      );

      if (!isInView) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.timeout = setTimeout(() => this.timeout = null, 350);
  }

  private progress(processed: number, total: number) {
    const progress = Math.floor(((100 * processed) / total));

    this.form.progressBar.style.width = progress + '%';
  }

  private async startProgress(cancelable: boolean = true) {
    const settings = await SettingsService.get();

    this.form.progressBar.hidden = false;
    this.form.remove.disabled = true;
    this.processing = true;
    this.disabled = true;

    if (cancelable) {
      this.form.check.parentElement.hidden = true;
      this.form.cancel.parentElement.hidden = false;
      this.canceled = false;
    } else {
      BookmarkRenderService.disableItems();
    }

    BookmarkManagerService.timeout = settings.timeout;

    await delay();
  }

  private async finishProgress(wait = true) {
    const animations = this.form.progressBar.getAnimations();
    const selectedItems = BookmarkManagerService.selection.size;

    if (wait && animations?.length > 0) {
      await animations[0].finished;
    }

    this.disabled = false;
    this.processing = false;
    this.form.check.parentElement.hidden = false;
    this.form.cancel.parentElement.hidden = true;
    this.form.cancel.disabled = false;
    this.form.progressBar.hidden = true;
    this.form.progressBar.style.width = '0%';
    this.form.remove.disabled = selectedItems === 0;

    await this.wakeLock?.release();
    setTimeout(() => console.clear(), 3000);
  }

  private cancelRequests() {
    this.canceled = true;
    this.form.cancel.disabled = true;
    this.form.progressBar.hidden = true;

    // this.requests?.forEach(request => request.abort());
  }

  private onSelectionChange() {
    const size = BookmarkManagerService.selection.size;

    this.form.remove.disabled = this.processing || size === 0;
    this.form.removeCount.hidden = size === 0;
    this.form.removeCount.innerText = size.toString();
    (this.form.check.nextElementSibling as HTMLElement).innerText = size === 0 ? 'Check all' : ' Check selected';
  }

  private async onRecursiveChange() {
    const settings = await SettingsService.get();

    settings.recursive = this.form.expand.checked;

    SettingsService.set(settings);
    UrlService.set({ recursive: settings.recursive, page: null });
  }

  private async onTimeoutChange() {
    const settings = await SettingsService.get();
    const value = Number(this.form.timeout.value);
    const timeout = Math.max(value, 1);

    settings.timeout = timeout;
    BookmarkManagerService.timeout = settings.timeout;

    this.form.timeoutText.innerText = timeout + ' s';
    SettingsService.set(settings);
  }

  private async onItemsRendered() {
    if (!this.processing) {
      this.form.check.disabled = !Array
        .from(BookmarkRenderService.items.values()).some(i => i.type === BookmarkTypes.LINK);
    }
  }

  private async requestWakeLock() {
    try {
      this.wakeLock?.release();
      this.wakeLock = await navigator.wakeLock.request();
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }

  private async onRemove() {
    this.form.pagination.disabled = true;

    const dialog = document.getElementById('dialog') as DialogElement;
    const message = 'Please confirm that your selection is correct.\nAttention! This action is irreversible!';
    const ok = await dialog.open('Attention', message);

    if (ok) {
      const { page } = await UrlService.get();

      await this.startProgress(false);
      await BookmarkManagerService.removeSelected((i, t) => this.progress(i, t));

      if (page > 1 && await BookmarkRenderService.getSize() === 0) {
        UrlService.set({ page: Math.min(page - 1, 0) });
      } else {
        await BookmarkRenderService.render();
        this.form.pagination.setPage(page, await BookmarkRenderService.total);
      }

      await this.finishProgress();
    }

    this.form.pagination.disabled = false;
  }
}
