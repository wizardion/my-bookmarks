import { BookmarkFolderElement } from 'components/bookmark-folder/bookmark-folder.component';
import { BookmarkElement } from 'components/bookmark/bookmark.component';
import { IBookmarkElement } from 'components/models/bookmark.models';
import { BookmarkToolbarElement } from 'components/toolbar/toolbar.component';
import { BookmarkManagerService } from 'services/bookmark-manager.service';
import { UrlService } from 'services/url.service';


export class ToolbarKeyboardService {
  protected static toolbar: BookmarkToolbarElement;
  private static focusedElement: IBookmarkElement;
  private static direction: boolean = null;
  private static timeout: NodeJS.Timeout;

  static watch(toolbar: BookmarkToolbarElement): void {
    this.toolbar = toolbar;
    window.addEventListener('keydown', (e) => this.onWindowKeydown(e));
    window.addEventListener('keyup', (e) => this.onWindowKeyup(e));
    window.addEventListener('click', (e) => this.onWindowClick(e));
  }

  private static onWindowClick(e: MouseEvent) {
    if (this.focusedElement && e.shiftKey) {
      const element = this.findBookmarkElement(<HTMLElement>e.target);

      if (element) {
        const last = element.parentElement;
        const nextSibling = (element.offsetTop > this.focusedElement.offsetTop);
        const checked = (e.target as HTMLInputElement).checked && this.focusedElement.selected;
        const predicate = (el?: HTMLElement) => nextSibling ? el.nextElementSibling : el.previousElementSibling;
        let line = predicate(this.focusedElement.parentElement) as HTMLElement;

        if (checked !== this.focusedElement.selected) {
          this.focusedElement.setSelection(checked);
        }

        while (line && line !== last) {
          const bookmark = line.firstChild as IBookmarkElement;

          if (((bookmark instanceof BookmarkElement) || (bookmark instanceof BookmarkFolderElement))) {
            bookmark.setSelection(checked);
            BookmarkManagerService.setSelection(Number(bookmark.id), checked);
          }

          line = predicate(line) as HTMLElement;
        }

        this.focusedElement = last.firstChild as IBookmarkElement;
      }
    }
  }

  private static onWindowKeyup(e: KeyboardEvent) {
    if (e.key === 'Shift') {
      this.focusedElement?.setFocus('checkbox');
      this.focusedElement = null;
      this.direction = null;
    }

    if (this.timeout) {
      clearInterval(this.timeout);
      this.timeout = null;
    }
  }

  private static async onWindowKeydown(e: KeyboardEvent) {
    if (e.key === 'Shift') {
      this.focusedElement = this.findBookmarkElement(<HTMLElement>e.target);
    }

    if (!this.timeout && this.focusedElement && e.shiftKey && (e.code === 'ArrowDown' || e.code === 'ArrowUp')) {
      this.timeout = setTimeout(() => this.timeout = null, 100);

      e.preventDefault();
      e.stopPropagation();

      return this.selectNextItem(<HTMLElement>e.target, e.code === 'ArrowDown');
    }

    if (!e.shiftKey && !this.timeout && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')
      && !this.toolbar.form.pagination.disabled) {
      const { page } = await UrlService.get();
      const step = (e.code === 'ArrowRight' ? 1 : -1);
      const id = Math.max(Math.min(page + step, this.toolbar.form.pagination.pageCount), 1);

      e.preventDefault();
      e.stopPropagation();

      UrlService.set({ page: id });
      this.timeout = setTimeout(() => this.timeout = null, 100);
    }

    if (e.metaKey && e.code === 'KeyA') {
      this.selectAll();
      e.preventDefault();
      e.stopPropagation();
    }
  }

  private static selectNextItem(target: HTMLElement, down: boolean) {
    const element = this.findBookmarkElement(target);

    if (element) {
      const checked = (target as HTMLInputElement).checked;
      const item = down
        ? this.findNextBookmarkElement(this.focusedElement, checked)
        : this.findPrevBookmarkElement(this.focusedElement, checked);

      if (this.direction === null) {
        this.direction = down;
      } else if (this.direction !== down) {
        this.direction = down;
        this.focusedElement.setFocus('checkbox');
        this.focusedElement.setSelection(!checked);
        BookmarkManagerService.setSelection(Number(this.focusedElement.id), !checked);

        return this.focusedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }

      if (item) {
        this.focusedElement = item;
        this.focusedElement.setFocus('checkbox');
        this.focusedElement.setSelection(checked);
        this.focusedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        BookmarkManagerService.setSelection(Number(this.focusedElement.id), checked);
      }
    }
  }

  private static selectAll() {
    const items = [].concat(
      Array.from(document.querySelectorAll('bookmark-item')),
      Array.from(document.querySelectorAll('bookmark-folder')),
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as IBookmarkElement;

      item.setSelection();
      BookmarkManagerService.setSelection(Number(item.id), true);
    }
  }

  private static findBookmarkElement(target: HTMLElement): IBookmarkElement | null {
    if (target instanceof HTMLInputElement && (target as HTMLInputElement).type === 'checkbox') {
      let element = (target as HTMLInputElement).parentElement;

      while (!(element instanceof HTMLBodyElement)) {
        element = element.parentElement;

        if ((element instanceof BookmarkElement) || (element instanceof BookmarkFolderElement)) {
          return element as IBookmarkElement;
        }
      }
    }

    return null;
  }

  private static findNextBookmarkElement(element: IBookmarkElement, checked: boolean): IBookmarkElement | null {
    let line = element.parentElement.nextElementSibling;

    while (line) {
      const element = line.firstChild;

      if (((element instanceof BookmarkElement) || (element instanceof BookmarkFolderElement))
        && ((element as IBookmarkElement).selected !== checked)) {
        return element as IBookmarkElement;
      }

      line = line.nextElementSibling as HTMLElement;
    }

    return null;
  }

  private static findPrevBookmarkElement(element: IBookmarkElement, checked: boolean): IBookmarkElement | null {
    let line = element.parentElement.previousElementSibling;

    while (line) {
      const element = line.firstChild;

      if (((element instanceof BookmarkElement) || (element instanceof BookmarkFolderElement))
        && ((element as IBookmarkElement).selected !== checked)) {
        return element as IBookmarkElement;
      }

      line = line.previousElementSibling as HTMLElement;
    }

    return null;
  }
}
