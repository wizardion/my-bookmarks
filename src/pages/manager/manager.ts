import 'styles/themes/light.scss';
import './assets/styles/body.scss';
import './assets/styles/manager.scss';

import { BookmarkElement } from 'components/bookmark/bookmark.component';
import { BookmarkRender } from 'services/bookmarks-render.service';
import { BookmarkFolderElement } from 'components/bookmark-folder/bookmark-folder.component';
import { BookmarkToolbarElement } from 'components/toolbar/toolbar.component';
import { Debounce } from 'services/debounce.service';
import { SettingsService } from 'services/settings.service';


function whenDefined(): Promise<CustomElementConstructor[]> {
  customElements.define(BookmarkElement.selector, BookmarkElement);
  customElements.define(BookmarkFolderElement.selector, BookmarkFolderElement);
  customElements.define(BookmarkToolbarElement.selector, BookmarkToolbarElement);

  return Promise.all([
    customElements.whenDefined(BookmarkElement.selector),
    customElements.whenDefined(BookmarkFolderElement.selector),
    customElements.whenDefined(BookmarkToolbarElement.selector)
  ]);
}

function debounceScroll(element: HTMLElement) {
  let dataScroll = false;
  const debounced = Debounce.debounce(() => {
    const rect = element.getBoundingClientRect();
    const stuck = rect.top <= 0;

    if (stuck !== dataScroll) {
      dataScroll = stuck;
      element.dataset.scroll = dataScroll.toString();
    }
  });

  window.addEventListener('scroll', debounced, { capture: true, passive: true });
}

whenDefined().then(async () => {
  const settings = await SettingsService.get();
  const toolbar = document.getElementById('toolbar') as BookmarkToolbarElement;
  const parent = document.getElementById('parent-folder') as HTMLDivElement;
  const goBack = document.getElementById('go-back') as HTMLLinkElement;
  const urlParams = new URLSearchParams(window.location.search);
  const topLevel = !Number(urlParams.get('id') || '0');

  toolbar.settings = settings;
  BookmarkRender.levelId = urlParams.get('id') || '0';
  BookmarkRender.recursive = !topLevel && settings.recursive;
  BookmarkRender.content = document.getElementById('bookmarks') as HTMLDivElement;

  await BookmarkRender.render();

  if (BookmarkRender.bookmarks.length > 0) {
    toolbar.disabled = false;
    BookmarkRender.bookmarks.forEach(b => b.disabled = false);
  }

  if (urlParams.has('id')) {
    const current = (await chrome.bookmarks.get(urlParams.get('id'))).shift();

    if (current && current.parentId) {
      goBack.hidden = false;
      goBack.href = current.parentId !== '0' ? `?id=${current.parentId}` : window.location.pathname;
      parent.innerText = current.title;
    }
  }

  debounceScroll(toolbar.parentElement);
});
