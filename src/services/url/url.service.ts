import { SettingsService } from '../settings/settings.service';
import { UrlParams } from './url-params';
import { SETTINGS_DEFAULTS } from 'services/settings/utils/settings.constant';
import { IUrlParams } from './models/url.models';
import { ISettings } from 'services/settings/models/settings.models';

export type IUrlParamListener = (e: UrlParams) => void;

export class UrlService {
  protected static listeners: IUrlParamListener[] = [];

  static async get(): Promise<UrlParams> {
    const settings = await SettingsService.get();

    return new UrlParams(settings, window.location.search);
  }

  static async set(params: Partial<IUrlParams>): Promise<void> {
    window.history.pushState(params, '', this.toUrlParamsString(params));
    window.dispatchEvent(new Event('pushstate'));
  }

  static addEventListener(name: 'urlChange', fn: IUrlParamListener) {
    if (name !== 'urlChange') {
      throw new Error(`"${name}" - is not supported.`);
    }

    if (!this.listeners.length) {
      window.addEventListener('popstate', () => this.dispatchEvent());
      window.addEventListener('pushstate', () => this.dispatchEvent());
    }

    this.listeners.push(fn);
  }

  static emitEvent() {
    this.dispatchEvent();
  }

  protected static toUrlParamsString(params: Partial<IUrlParams>): string {
    const urlParams = new URLSearchParams(window.location.search);
    const defaultSettings = new Map<keyof ISettings, ISettings[keyof ISettings]>(
      Object.entries(SETTINGS_DEFAULTS) as [
        keyof ISettings, ISettings[keyof ISettings]
      ][]
    );

    for (const [key, value] of Object.entries(params)) {
      if (value === null) {
        urlParams.delete(key);
      } else {
        urlParams.set(key, String(value));
      }
    }

    for (const [key, value] of defaultSettings) {
      if (urlParams.has(key) && urlParams.get(key) === String(value)) {
        urlParams.delete(key);
      }
    }

    return urlParams.size > 0 ? `?${urlParams.toString()}` : window.location.pathname;
  }

  private static async dispatchEvent() {
    const urlParams = await this.get();

    for (const listener of this.listeners) {
      listener(urlParams);
    }
  }
}
