import 'styles/themes/auto.scss';
import './assets/styles/body.scss';
import './assets/styles/manager.scss';

import { BookmarkRenderService } from 'services/renders/bookmarks-render.service';
import { BookmarkToolbarElement } from 'components/toolbar/toolbar.component';
import { PaginationElement } from 'components/pagination/pagination.component';
import { IUrlParams } from 'services/settings/models/settings.models';
import { Debounce } from 'services/debounce.service';
import { UrlService } from 'services/url/url.service';
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
  const { page, size, recursive, unsuccesfull } = await UrlService.get();

  if (unsuccesfull && !BookmarkRenderService.total) {
    return UrlService.set({ unsuccesfull: false, page: null });
  }

  BookmarkRenderService.filters.itemsPerPage = size;
  BookmarkRenderService.filters.page = page;
  BookmarkRenderService.filters.recursive = recursive;
  // BookmarkRenderService.unsuccesfull = unsuccesfull;

  await BookmarkRenderService.render();
  pagination.setPage(page, BookmarkRenderService.total, size);

  if (window.scrollY > toolbar.offsetTop) {
    window.scrollTo({ top: toolbar.offsetTop });
  }
}

async function onItemsRendered(toolbar: BookmarkToolbarElement, urlParams: IUrlParams) {
  const pagination = document.getElementById('nav-pagination') as PaginationElement;

  if (urlParams.levelId === 0 || !urlParams.has('id')) {
    BookmarkRenderService.disableItems();
  } else {
    toolbar.disabled = false;
  }

  pagination.setPage(urlParams.page, BookmarkRenderService.total, urlParams.size);

  debounceScroll(toolbar.parentElement);
  window.addEventListener('popstate', () => onUrlChange());
  window.addEventListener('pushstate', () => onUrlChange());

  if (urlParams.unsuccesfull) {
    return UrlService.set({ unsuccesfull: null, page: null });
  }
}

whenDefined().then(async () => {
  const pagination = document.getElementById('nav-pagination') as PaginationElement;
  const toolbar = document.getElementById('toolbar') as BookmarkToolbarElement;
  const goBackLink = document.getElementById('go-back') as HTMLLinkElement;
  const urlParams = await UrlService.get();

  BookmarkRenderService.levelId = urlParams.levelId;
  BookmarkRenderService.filters.page = urlParams.page;
  BookmarkRenderService.filters.itemsPerPage = urlParams.size;
  BookmarkRenderService.content = <HTMLDivElement>document.getElementById('bookmarks');
  BookmarkRenderService.filters.recursive = (
    urlParams.levelId !== 0 && urlParams.recursive
  );
  // BookmarkRenderService.content.parentElement.hidden = false;

  toolbar.parentElement.hidden = false;
  pagination.pageSize = urlParams.size;

  if (urlParams.levelId !== 0 && urlParams.has('id')) {
    try {
      const current = (await chrome.bookmarks.get(String(urlParams.levelId))).shift();

      if (current && current.parentId) {
        goBackLink.hidden = false;
        goBackLink.href = current.parentId !== '0'
          ? `?id=${current.parentId}`
          : window.location.pathname;
      }
    } catch (error) {
      goBackLink.hidden = false;
      goBackLink.href = window.location.pathname;
      console.log('error', error);
    }
  }

  BookmarkRenderService.render().then(() => onItemsRendered(toolbar, urlParams));
});
