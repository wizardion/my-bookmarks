import 'styles/themes/auto.scss';
import './assets/styles/body.scss';
import './assets/styles/manager.scss';

import { BookmarkRenderService } from 'services/bookmarks-render.service';
import { BookmarkToolbarElement } from 'components/toolbar/toolbar.component';
import { PaginationElement } from 'components/pagination/pagination.component';
import { IUrlParams } from 'services/models/settings.models';
import { Debounce } from 'services/debounce.service';
import { UrlService } from 'services/url.service';
import { whenDefined } from 'components';


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

async function onUrlChange() {
  const toolbar = document.getElementById('stick') as HTMLDivElement;
  const pagination = document.getElementById('nav-pagination') as PaginationElement;
  const { page, size, recursive } = await UrlService.get();
  const redraw = recursive !== BookmarkRenderService.recursive;

  BookmarkRenderService.count = size;
  BookmarkRenderService.start = (page - 1) * size;
  BookmarkRenderService.recursive = recursive;

  await BookmarkRenderService.render(redraw);
  pagination.setPage(page, BookmarkRenderService.total, size);

  if (window.scrollY > toolbar.offsetTop) {
    window.scrollTo({ top: toolbar.offsetTop });
  }
}

async function onItemsRendered(toolbar: BookmarkToolbarElement, urlParams: IUrlParams) {
  const pagination = document.getElementById('nav-pagination') as PaginationElement;

  if (urlParams.levelId === '0' || !urlParams.has('id')) {
    BookmarkRenderService.disableItems();
  } else {
    toolbar.disabled = false;
  }

  pagination.setPage(urlParams.page, BookmarkRenderService.total, urlParams.size);

  debounceScroll(toolbar.parentElement);
  window.addEventListener('popstate', () => onUrlChange());
  window.addEventListener('pushstate', () => onUrlChange());
}

whenDefined().then(async () => {
  const pagination = document.getElementById('nav-pagination') as PaginationElement;
  const toolbar = document.getElementById('toolbar') as BookmarkToolbarElement;
  const currentFolder = document.getElementById('parent-folder') as HTMLDivElement;
  const goBackLink = document.getElementById('go-back') as HTMLLinkElement;
  const urlParams = await UrlService.get();

  BookmarkRenderService.count = urlParams.size;
  BookmarkRenderService.levelId = urlParams.levelId;
  BookmarkRenderService.start = (urlParams.page - 1) * urlParams.size;
  BookmarkRenderService.recursive = urlParams.levelId !== '0' && urlParams.recursive;
  BookmarkRenderService.content = document.getElementById('bookmarks') as HTMLDivElement;
  BookmarkRenderService.content.parentElement.hidden = false;
  toolbar.parentElement.hidden = false;
  pagination.pageSize = urlParams.size;

  if (urlParams.levelId !== '0' && urlParams.has('id')) {
    const current = (await chrome.bookmarks.get(urlParams.levelId)).shift();

    if (current && current.parentId) {
      goBackLink.hidden = false;
      goBackLink.href = current.parentId !== '0' ? `?id=${current.parentId}` : window.location.pathname;
      currentFolder.innerText = current.title;
    }
  }

  BookmarkRenderService.render().then(() => onItemsRendered(toolbar, urlParams));
});
