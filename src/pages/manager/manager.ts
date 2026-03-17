import 'styles/themes/auto.scss';
import './assets/styles/body.scss';
import './assets/styles/manager.scss';

import { BookmarkRenderService } from 'services/renders/bookmarks-render.service';
import { BookmarkToolbarElement } from 'components/toolbar/toolbar.component';
import { PaginationElement } from 'components/pagination/pagination.component';
import { Debounce } from 'services/debounce.service';
import { UrlService } from 'services/url/url.service';
import { whenDefined } from 'components';
import { IndexedDBManager } from 'services/indexed-db/bookmark-manager.service';
import { UrlParams } from 'services/url/url-params';


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

async function debounceUpLink(urlParams: UrlParams) {
  const goBackLink = document.getElementById('go-back') as HTMLLinkElement;

  try {
    const db = new IndexedDBManager();
    const current = await db.get(urlParams.id);

    if (current?.id) {
      goBackLink.style.visibility = '';
      goBackLink.href = current.parentId !== 0
        ? `?id=${current.parentId}`
        : window.location.pathname;
    } else {
      goBackLink.style.visibility = 'hidden';
    }
  } catch {
    goBackLink.style.visibility = '';
    goBackLink.href = window.location.pathname;
  }
}

function navigateUp(event: Event) {
  const goBackLink = document.getElementById('go-back') as HTMLLinkElement;
  const targetUrl = goBackLink.getAttribute('href');
  const params = new URLSearchParams(targetUrl || '');

  event.preventDefault();

  UrlService.set({
    id: params.has('id') ? Number(params.get('id')) : null,
    page: null
  });
}

async function onUrlChange(urlParams: UrlParams) {
  const toolbar = document.getElementById('toolbar') as BookmarkToolbarElement;
  const pagination = document.getElementById('nav-pagination') as PaginationElement;
  const stick = document.getElementById('stick') as HTMLDivElement;

  BookmarkRenderService.levelId = urlParams.id;
  BookmarkRenderService.filters.page = urlParams.page;
  BookmarkRenderService.filters.itemsPerPage = urlParams.size;
  BookmarkRenderService.filters.recursive = (
    urlParams.id !== 0 && urlParams.recursive
  );

  if (window.scrollY > stick.offsetTop) {
    window.scrollTo({ top: stick.offsetTop, behavior: 'instant' });
  }

  const total = await BookmarkRenderService.countItems();

  toolbar.disabled = urlParams.id === 0;

  debounceUpLink(urlParams);
  pagination.setPage(urlParams.page, total, urlParams.size);

  await BookmarkRenderService.render();
}

chrome.runtime.onMessage.addListener(() => {
  window.location.reload();
});

whenDefined().then(async () => {
  const goBackLink = document.getElementById('go-back') as HTMLLinkElement;
  const toolbar = document.getElementById('toolbar') as BookmarkToolbarElement;
  const urlParams = await UrlService.get();

  toolbar.parentElement.hidden = false;

  BookmarkRenderService.init(document.getElementById('bookmarks'));

  debounceScroll(toolbar.parentElement);
  goBackLink.addEventListener('click', (e) => navigateUp(e));

  await onUrlChange(urlParams);
  UrlService.addEventListener('urlChange', (e) => onUrlChange(e));
});
