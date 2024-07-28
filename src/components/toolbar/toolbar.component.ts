import './assets/styles/toolbar.component.scss';

import { BaseElement } from '../base.component';
import { BookmarkElement } from 'components/bookmark/bookmark.component';
import { BookmarkRender } from 'services/bookmarks-render.service';
import { IToolbarForm } from './models/toolbar.models';
import { delay } from 'core/index';
import { BookmarkManager } from 'services/bookmark-manager.service';
import { SettingsService } from 'services/settings.service';
import { ISettings } from 'services/models/settings.models';


const template: DocumentFragment = BaseElement.template({
  templateUrl: './toolbar.component.html'
});

export class BookmarkToolbarElement extends BaseElement {
  static readonly selector = 'bookmark-toolbar';

  protected form: IToolbarForm;
  protected canceled: boolean;
  protected _settings: ISettings;
  protected requests: BookmarkElement[];
  protected readonly chunkSize: number = 10;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);

    this.form = {
      expand: this.template.querySelector('[name="expand-all"]'),
      check: this.template.querySelector('[name="check-bookmarks"]'),
      cancel: this.template.querySelector('[name="cancel-check"]'),
      remove: this.template.querySelector('[name="remove-bookmarks"]'),
      timeout: this.template.querySelector('[name="timeout-range"]'),
      timeoutText: this.template.querySelector('[name="timeout-text"]'),
      progressBar: this.template.querySelector('[name="progress-bar"]'),
    };
  }

  protected eventListeners(): void {
    this.form.expand.addEventListener('change', () => this.onRecursiveChange());
    this.form.check.addEventListener('click', () => this.checkAllBookmarks(BookmarkRender.bookmarks));
    this.form.timeout.addEventListener('input', () => {
      const value = Number(this.form.timeout.value);
      const timeout = Math.max(value, 1);

      this.form.timeoutText.innerText = timeout + ' s';
    });

    this.form.cancel.addEventListener('click', () => this.cancelRequests());
    this.form.remove.addEventListener('click', () => this.removeSelected());

    BookmarkManager.addEventListener('select', () => this.onSelectionChange());
  }

  protected async checkAllBookmarks(bookmarks: BookmarkElement[]) {
    const chunks = Array.from({ length: Math.ceil(bookmarks.length / this.chunkSize) }, (_, i) =>
      bookmarks.slice(i * this.chunkSize, i * this.chunkSize + this.chunkSize)
    );

    bookmarks.forEach(b => b.reset());
    await this.startProgress();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const promises: Promise<void>[] = [];

      this.progress(i * 10 + chunk.length, bookmarks.length);

      for (let j = 0; j < chunk.length && !this.canceled; j++) {
        const element = chunk[j];
        const promise = element.checkBookmark();

        promises.push(promise);
        promise.finally(() => this.processResult(element));
        this.requests.push(element);

        await delay(100);
      }

      await Promise.all(promises);
    }

    await this.finishProgress();
  }

  set disabled(value: boolean) {
    this.form.expand.disabled = value;
    this.form.check.disabled = value;
    this.form.timeout.disabled = value;

    super.disabled = value;
  }

  set settings(value: ISettings) {
    this._settings = value;

    this.form.expand.checked = value.recursive;
  }

  private progress(processed: number, total: number): number {
    const progress = Math.round(((100 * processed) / total));

    this.form.progressBar.style.width = progress + '%';

    return progress;
  }

  private async finishProgress(wait = true) {
    const animations = this.form.progressBar.getAnimations();

    if (wait && animations?.length > 0) {
      await animations[0].finished;
    }

    this.disabled = false;
    this.form.check.hidden = false;
    this.form.cancel.hidden = true;
    this.form.progressBar.hidden = true;
    this.form.progressBar.style.width = '0%';
  }

  private async startProgress() {
    this.form.check.hidden = true;
    this.form.cancel.hidden = false;
    this.form.progressBar.hidden = false;
    this.disabled = true;
    this.canceled = false;
    this.requests = [];

    await delay();
  }

  private processResult(bookmark: BookmarkElement) {
    if (!bookmark.valid) {
      bookmark.select();
    }
  }

  private cancelRequests() {
    this.canceled = true;
    this.form.check.hidden = false;
    this.form.cancel.hidden = true;
    this.form.progressBar.hidden = true;

    this.requests?.forEach(request => request.abort());
  }

  private onSelectionChange() {
    this.form.remove.disabled = BookmarkManager.selection.size === 0;
  }

  private async onRecursiveChange() {
    this._settings.recursive = this.form.expand.checked;

    BookmarkRender.recursive = this._settings.recursive;

    BookmarkRender.render();
    SettingsService.set(this._settings);
  }

  private async removeSelected() {
    const message = 'Please confirm your selection is correct.\nAttention! This action is irreversible!';
    //'\nThe page will be reloaded.'

    if (window.confirm(message)) {
      await BookmarkManager.removeSelected();
    }
  }
}
