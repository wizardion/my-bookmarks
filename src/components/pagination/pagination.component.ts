import './assets/styles/pagination.component.scss';

import { BaseElement } from 'components/base/base.component';
import { IPaginationForm } from './models/pagination.models';
import { IEventListener } from 'core/index';
import { UrlService } from 'services/url.service';
import { SettingsService } from 'services/settings.service';


const template: DocumentFragment = BaseElement.template({
  templateUrl: './pagination.component.html'
});

export class PaginationElement extends BaseElement {
  static readonly selector = 'nav-pagination';

  form: IPaginationForm;
  handlers?: IEventListener[];

  private _total: number;
  private _currentPage: number;
  private _pageSize: number;
  private _pagesCount: number;
  private _disabled: boolean;

  constructor () {
    super();
    this.template = <HTMLElement>template.cloneNode(true);

    this.form = {
      next: this.template.querySelector('[name="next"]'),
      prev: this.template.querySelector('[name="prev"]'),
      fieldset: this.template.querySelector('[name="set"]'),
      pageSize: this.template.querySelector('[name="itemsPerPage"]')
    };
  }

  protected eventListeners(): void {
    this.form.next.addEventListener('mousedown', () => this.onPageChange(this._currentPage + 1));
    this.form.prev.addEventListener('mousedown', () => this.onPageChange(this._currentPage - 1));
    this.form.pageSize.addEventListener('change', () => this.onPageSizeChange());
  }

  setPage(page: number, total?: number, size?: number): void {
    this._currentPage = page;

    if (this.form.current && this.form.pages.length &&
      ((total && this._total !== total) || (size && this._pageSize !== size))) {
      this.clear();
    }

    this._total = isNaN(+total) ? this._total || 0 : total;
    this._pageSize = isNaN(+size) ? this._pageSize || 0 : size;
    this.form.pageSize.value = this._pageSize.toString();
    this._pagesCount = Math.ceil(this._total / this._pageSize);
    this.form.next.hidden = this._pagesCount < 2;
    this.form.prev.hidden = this._pagesCount < 2;
    this.form.fieldset.hidden = this._pagesCount < 2;

    this.form.prev.disabled = this._currentPage < 2;
    this.form.next.disabled = this._currentPage >= this._pagesCount;

    if (this.form.current && this.form.pages.length) {
      this.form.current.disabled = false;
      this.form.current.classList.remove('selected');
      this.form.pages[page - 1].disabled = true;
      this.form.pages[page - 1].classList.add('selected');
      this.form.current = this.form.pages[page - 1];
    } else {
      this.renderPages();
    }

    if (this.form.pages.length > 10) {
      const max = Math.min(Math.max(page - 5, 0) + 10, this.form.pages.length);
      const min = max - 10;

      for (let i = 0; i < this.form.pages.length; i++) {
        this.form.pages[i].hidden = (i < min || i >= max);
      }
    }
  }

  get page(): number {
    return this._currentPage;
  }

  get pageCount(): number {
    return this._pagesCount;
  }

  set pageSize(value: number) {
    this._pageSize = value;
    this.form.pageSize.value = value.toString();
  }

  set disabled(value: boolean) {
    this.form.prev.disabled = value;
    this.form.next.disabled = value;
    this.form.pageSize.disabled = value;
    this.form.fieldset.disabled = value;
    this._disabled = value;

    super.disabled = value;
  }

  get disabled(): boolean {
    return this._disabled;
  }

  private renderPages() {
    this.handlers = [];
    this.form.pages = [];

    for (let i = 1; i < this._pagesCount + 1; i++) {
      const button = document.createElement('button');
      const handler = () => this.onPageChange(i);

      button.type = 'button';
      button.innerText = i.toString();

      if (i === this._currentPage) {
        button.classList.add('selected');
        button.disabled = true;
        this.form.current = button;
      }

      this.handlers.push(handler);
      this.form.pages.push(button);
      button.addEventListener('click', handler);
      this.form.fieldset.appendChild(button);
    }
  }

  private clear() {
    for (let i = 0; i < this.form.pages?.length; i++) {
      const page = this.form.pages[i];

      page.removeEventListener('click', this.handlers[i]);
      page.remove();
    }

    this.form.current = null;
    this.form.pages = null;
  }

  private onPageChange(pageId: number) {
    const id = Math.max(Math.min(pageId, this.form.pages.length), 1);

    UrlService.set({ page: id, size: this._pageSize });
  }

  private async onPageSizeChange() {
    const settings = await SettingsService.get();

    settings.size = Number(this.form.pageSize.value);

    SettingsService.set(settings);
    UrlService.set({ page: null, size: Number(this.form.pageSize.value) });
  }
}
