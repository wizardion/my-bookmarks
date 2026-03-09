import './assets/styles/toolbar.component.scss';

import { BaseElement } from '../base/base.component';
import { BookmarkRenderService } from 'services/renders/bookmarks-render.service';
import { IRequestQueue, IToolbarForm } from './models/toolbar.models';
import { SettingsService } from 'services/settings/settings.service';
import { IBookmarkElement } from 'components/models/bookmark.models';
import { UrlService } from 'services/url/url.service';
import { delay } from 'core';
import { DialogElement } from 'components/dialog/dialog.component';
import { IBookmarkNode } from 'services/indexed-db/models/db.models';
import { StatusCodes } from 'services/indexed-db/models/db.enums';
import { UrlChecker } from 'services/url/url-checker.service';

const template: DocumentFragment = BaseElement.template({
  templateUrl: './toolbar.component.html'
});

export class BookmarkToolbarElement extends BaseElement {
  static readonly selector = 'bookmark-toolbar';

  public form: IToolbarForm;
  protected processing: boolean;
  protected canceled: boolean;
  protected wakeLock: WakeLockSentinel;
  protected requests: number = 0;
  protected totalRequests: number = 0;
  protected totalBookmarks: number = 0;

  protected readonly maxRequests: number = 99;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);

    this.form = {
      expand: this.template.querySelector('[name="expand-all"]'),
      unsuccesfull: this.template.querySelector('[name="unsuccesfull"]'),
      check: this.template.querySelector('[name="check-bookmarks"]'),
      cancel: this.template.querySelector('[name="cancel-check"]'),
      remove: this.template.querySelector('[name="remove-bookmarks"]'),
      removeCount: this.template.querySelector('[name="remove-count"]'),
      checkCount: this.template.querySelector('[name="check-count"]'),
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
    // this.form.unsuccesfull.checked = settings.unsuccesfull;
    this.form.timeout.value = settings.timeout.toString();
    this.form.timeoutText.innerText = settings.timeout + ' s';

    this.form.expand.addEventListener('change', () => this.onRecursiveChange());
    this.form.check.addEventListener('click', () => this.checkAllBookmarks());
    this.form.timeout.addEventListener('input', () => this.onTimeoutChange());
    this.form.cancel.addEventListener('click', () => this.cancelRequests());
    this.form.remove.addEventListener('click', () => this.onRemove());
    this.form.unsuccesfull
      .addEventListener('change', () => this.onUnsuccesfullChange());

    UrlChecker.setTimeout(settings.timeout);
    // BookmarksAPIManager.addEventListener('select', () => this.onSelectionChange());
    window.addEventListener('rendered', () => this.onItemsRendered());
    // ToolbarKeyboardService.watch(this);

    this.form.pagination.disabled = false;
  }

  protected async checkAllBookmarks() {
    // const hasSelection = BookmarksAPIManager.selection.size > 0;
    // const allItems = (
    //   hasSelection ? BookmarksAPIManager.getSelectedItems() : BookmarksAPIManager.getItems()
    // ).filter(i => i.type === BookmarkTypes.LINK);

    // this.totalBookmarks = allItems.length;

    // await this.startProgress();

    // BookmarksAPIManager.abort();
    // allItems.forEach(s => BookmarksAPIManager.bookmarks.get(s.id).status = null);
    // await BookmarkRenderService.render();

    // await this.requestWakeLock();
    // await this.checkItems(allItems);

    // await this.finishProgress();

    // const unsuccesfull = (
    //   Array.from(BookmarksAPIManager.bookmarks.values()).filter(i => i.status?.ok === false)
    // );

    // if (unsuccesfull.length) {
    //   this.form.unsuccesfull.checked = true;
    //   this.onUnsuccesfullChange();
    // }
  }

  protected async checkItems(items: IBookmarkNode[]) {
    const requests: Map<string, IRequestQueue[]> = new Map<string, IRequestQueue[]>();
    const lines: Promise<void>[] = [];

    for (let i = 0; i < items.length && !this.canceled; i++) {
      const item = items[i];
      const domain = this.getDomainName(item.url);
      const queue = requests.get(domain) || [];

      queue.push({
        id: item.id,
        resolved: false,
        url: item.url || 'chrome',
        promise: null,
        retries: 0
      });
      requests.set(domain, queue);
    }

    for (const request of requests) {
      const queue = request[1];

      lines.push(this.processQueue(queue));

      if (this.canceled) {
        break;
      }

      this.markPendingCount();
      await delay(150);
    }

    await Promise.all(lines);
  }

  set disabled(value: boolean) {
    this.form.expand.disabled = value;
    this.form.check.disabled = value;
    this.form.timeout.disabled = value;

    super.disabled = value;
  }

  set disabledCheck(value: boolean) {
    this.form.check.disabled = value;
  }

  private async processQueue(queue: IRequestQueue[]): Promise<void> {
    const maxRetries = 5;

    while (queue && queue.length && !this.canceled) {
      const item = queue.shift();

      this.requests += 1;
      this.totalRequests += 1;

      if (this.requests >= this.maxRequests) {
        while (this.requests > 1) {
          await delay(5000);
          await this.requestWakeLock();
          this.markPendingCount();
        }
      }

      this.setProgress(this.totalRequests, this.totalBookmarks);
      this.markPendingCount();

      if (item?.retries > 0) {
        await delay(1000);
      }

      try {
        const element = document.getElementById(item.id.toString()) as IBookmarkElement;
        const result = await (
          element ? element.checkBookmark() : UrlChecker.checkUrl(item.url)
        );

        if (
          !result.ok &&
          result.code === StatusCodes.timeout &&
          item?.retries < maxRetries
        ) {
          console.log(`retries: ${item?.retries}, ${item.url};`);
          await delay(1000);

          item.retries += 1;
          this.requests -= 1;
          this.totalRequests -= 1;
          queue.push(item);
          continue;
        }

        await this.requestWakeLock();
        // this.processResult(item.id, result);
      } catch (error) {
        console.error(`Error fetching ${item.id}:`, error);
      } finally {
        item.resolved = true;
        this.markPendingCount();
      }

      this.requests -= 1;
    }
  }

  // private async processResult(id: number, status: IBookmarkStatus) {
  //   const item = BookmarksAPIManager.bookmarks.get(id);

  //   if (item) {
  //     const bookmark = document.getElementById(id.toString()) as IBookmarkElement;
  //     const selected = !status.ok && [
  //       StatusCodes.error,
  //       StatusCodes.lost,
  //       StatusCodes.down,
  //     ].includes(status.code);

  //     bookmark?.setSelection(selected);
  //     // BookmarksAPIManager.setSelection(item.id, selected);

  //     item.status = status;
  //   }
  // }

  private getDomainName(path: string | null): string {
    try {
      const url = new URL(path || 'local');

      return url.hostname.replace(/^www\./, '');
    } catch (error) {
      console.error('Invalid URL:', error);

      return 'null';
    }
  }

  private setProgress(processed: number, total: number) {
    const progress = Math.floor(((100 * processed) / total));

    this.form.progressBar.style.width = progress + '%';
  }

  private async startProgress(cancelable: boolean = true) {
    const settings = await SettingsService.get();

    this.form.restCount.hidden = false;
    this.form.checkCount.hidden = false;
    this.form.progressBar.hidden = false;
    this.form.remove.disabled = true;
    this.form.unsuccesfull.disabled = true;
    this.processing = true;
    this.disabled = true;
    this.totalRequests = 0;
    this.requests = 0;

    if (cancelable) {
      this.form.check.parentElement.hidden = true;
      this.form.cancel.parentElement.hidden = false;
      this.canceled = false;
    } else {
      BookmarkRenderService.disableItems();
    }

    UrlChecker.setTimeout(settings.timeout);

    await delay();
  }

  private async finishProgress(wait = true) {
    // const animations = this.form.progressBar.getAnimations();
    // const selectedItems = BookmarksAPIManager.selection.size;
    // const unsuccesfullItems = Array.from(BookmarksAPIManager.bookmarks.values())
    //   .filter(i => i.status?.ok === false).length;

    // if (wait && animations?.length > 0) {
    //   await animations[0].finished;
    // }

    // this.disabled = false;
    // this.processing = false;
    // this.form.check.parentElement.hidden = false;
    // this.form.cancel.parentElement.hidden = true;
    // this.form.cancel.disabled = false;
    // this.form.progressBar.hidden = true;
    // this.form.progressBar.style.width = '0%';
    // this.form.remove.disabled = selectedItems === 0;
    // this.form.unsuccesfull.disabled = unsuccesfullItems === 0;
    // this.form.restCount.hidden = true;
    // this.form.restCount.innerText = '';
    // this.form.checkCount.hidden = true;
    // this.form.checkCount.innerText = '';
    // this.totalRequests = 0;
    // this.requests = 0;

    // await this.wakeLock?.release();
    // // setTimeout(() => console.clear(), 3000);
  }

  private cancelRequests() {
    this.canceled = true;
    this.form.cancel.disabled = true;
    this.form.progressBar.hidden = true;

    UrlChecker.abort();
  }

  private onSelectionChange() {
    // const size = BookmarksAPIManager.selection.size;

    // this.form.remove.disabled = this.processing || size === 0;
    // this.form.removeCount.hidden = size === 0;
    // this.form.removeCount.innerText = size.toString();
    // (this.form.check.nextElementSibling as HTMLElement).innerText = size === 0
    //   ? 'Check all'
    //   : ' Check selected';
  }

  private markPendingCount() {
    const digits = Math.floor(Math.log10(this.totalBookmarks)) + 1;

    this.form.checkCount.innerText = (
      `${String(this.totalRequests).padStart(digits, '0')} / ${this.totalBookmarks}`
    );
    this.form.restCount.innerText = (
      `pending: ${String(this.requests).padStart(2, '0')}`
    );
  }

  private async onRecursiveChange() {
    const settings = await SettingsService.get();

    settings.recursive = this.form.expand.checked;

    // SettingsService.set(settings);
    UrlService.set({ recursive: settings.recursive, page: null });
  }

  private async onUnsuccesfullChange() {
    // const settings = await SettingsService.get();
    // settings.unsuccesfull = this.form.unsuccesfull.checked;
    // SettingsService.set(settings);
    // UrlService.set({ unsuccesfull: settings.unsuccesfull, page: null });

    BookmarkRenderService.filters.unsuccessfulOnly = this.form.unsuccesfull.checked;
    UrlService.set({ page: null });
  }

  private async onTimeoutChange() {
    const settings = await SettingsService.get();
    const value = Number(this.form.timeout.value);
    const timeout = Math.max(value, 1);

    settings.timeout = timeout;
    UrlChecker.setTimeout(settings.timeout);

    this.form.timeoutText.innerText = timeout + ' s';
    SettingsService.set(settings);
  }

  private async onItemsRendered() {
    // if (!this.processing) {
    //   this.form.check.disabled = !Array
    //     .from(BookmarkRenderService.items.values())
    //     .some(i => i.type === BookmarkTypes.LINK);
    // }
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
    // this.form.pagination.disabled = true;

    // const dialog = document.getElementById('dialog') as DialogElement;
    // const message = 'Please confirm that your selection is correct.\n' +
    //   'Attention! This action is irreversible!';
    // const ok = await dialog.open('Attention', message);

    // if (ok) {
    //   const { page } = await UrlService.get();

    //   await this.startProgress(false);
    //   await BookmarksAPIManager.removeSelected((i, t) => this.setProgress(i, t));

    //   if (page > 1 && await BookmarkRenderService.total === 0) {
    //     UrlService.set({ page: Math.min(page - 1, 0) });
    //   } else {
    //     await BookmarkRenderService.render();
    //     this.form.pagination.setPage(page, await BookmarkRenderService.total);
    //   }

    //   await this.finishProgress();
    // }

    // this.form.pagination.disabled = false;
  }
}
