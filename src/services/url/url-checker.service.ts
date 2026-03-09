import { StatusCodes } from "services/indexed-db/models/db.enums";
import { IHttpStatus, IURLResponseStatus } from "./models/url.models";
import { StatusMessages } from "./models/url.enums";
import { delay } from "core/index";

export class UrlChecker {
  private static timeout: number = 0;
  private static signals: Map<number, AbortController> = new Map();

  public static async checkUrl(
    url: string,
    method = 'HEAD',
    level: number = 0
  ): Promise<IURLResponseStatus> {
    if (url.match(/^chrome/g,)) {
      await delay(500);

      return this.getStatus({
        ok: false,
        status: -3,
        statusText: 'Scheme "chrome" is not supported.'
      });
    }

    const controller = new AbortController();
    const id = Number(
      setTimeout(() => controller.abort('timeout'), this.timeout * 1000)
    );

    this.signals.set(id, controller);

    try {
      const response = await fetch(url, {
        method: method,
        // cache: 'no-cache',
        mode: 'cors',
        signal: controller.signal,
        referrer: url,
        // window: null,
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'content-type,x-pingother',
          'Content-Security-Policy': `script-src 'self' ${url};`,
          // 'Cache': 'no-cache'
          'User-Agent': window.navigator.userAgent,

          // Tells the server what formats you accept
          'Accept': 'text/html,application/xhtml+xml,application/xml;' +
            'q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',

          // Mimics a request coming from a navigation event
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',

          // Optional: Helps if the site checks where you came from
          'Referer': url
        }),
      });

      if (response.status === 0 &&
        (response.type === 'opaque' || response.type === 'opaqueredirect')) {
        return this.getStatus({
          ok: false, status: 403, statusText: response.statusText
        });
      }

      if (response.redirected) {
        const url1 = new URL(url);
        const url2 = new URL(response.url);

        if (url1.pathname !== url2.pathname && url2.pathname === '/') {
          return this.getStatus({
            ok: false, status: 301, statusText: response.statusText
          });
        }
      }

      if (
        (method === 'HEAD' &&
          ([403, 404, 405].includes(response.status) || response.status >= 500))
      ) {
        clearTimeout(id);
        this.signals.delete(id);

        return this.checkUrl(url, 'GET', level + 1);
      }

      return this.getStatus({
        ok: response.ok, status: response.status, statusText: response.statusText
      });
    } catch (error) {
      if (error === 'stop') {
        return this.getStatus({ ok: false, status: -5, statusText: 'Canceled' });
      }

      if (error === 'timeout') {
        return this.getStatus({
          ok: false, status: -1, statusText: 'Request is timed out'
        });
      }

      console.log('Fetch error:', String(error), url);

      return this.getStatus({
        ok: false, status: -6, statusText: 'Failed to request URL'
      });
    } finally {
      this.signals.delete(id);
      clearTimeout(id);
      await delay(500);
    }
  }

  public static abort() {
    this.signals.forEach((signal) => signal.abort('stop'));
    this.signals.clear();
  }

  public static setTimeout(value: number) {
    this.timeout = value;
  }

  private static getStatus(response: IHttpStatus): IURLResponseStatus {
    if (response.ok) {
      return {
        ok: true,
        code: StatusCodes.ok,
        className: 'success',
        title: StatusMessages.success
      };
    }

    if (response.status === -5) {
      return {
        ok: true,
        code: StatusCodes.canceled,
        className: null,
        title: null
      };
    }

    if (response.status === -6) {
      return {
        ok: false,
        code: StatusCodes.down,
        className: 'error',
        title: response.statusText
      };
    }

    if ([301, 302].includes(response.status)) {
      return {
        ok: false, code: StatusCodes.redirected, className: 'redirected',
        title: response.statusText || StatusMessages.redirected
      };
    }

    if ([-1, 408, 429, 504, 503].includes(response.status)) {
      return {
        ok: false, code: StatusCodes.timeout, className: 'timeout',
        title: StatusMessages.timeout
      };
    }

    if (response.status > 499 || [423, -2].includes(response.status)) {
      return {
        ok: false,
        code: StatusCodes.error,
        className: 'error',
        title: StatusMessages.error
      };
    }

    if ([404, 406, 410].includes(response.status)) {
      return {
        ok: false, code: StatusCodes.lost, className: 'lost',
        title: `${StatusMessages.lost} [${response.status}]`
      };
    }

    if ([-3, 401, 402, 403, 407, 422, 451, 423].includes(response.status)) {
      return {
        ok: false, code: StatusCodes.forbidden, className: 'forbidden',
        title: `${StatusMessages.forbidden} [${response.status}]`
      };
    }

    return {
      ok: false, code: StatusCodes.unsuccessful, className: 'unsuccessful',
      title: response.statusText ||
        `${StatusMessages.unsuccessful} [${response.status}]`
    };
  }
}