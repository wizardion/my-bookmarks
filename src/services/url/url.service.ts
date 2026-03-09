
import { ISettings, IUrlParams } from 'services/settings/models/settings.models';
import { SettingsService } from '../settings/settings.service';
import { UrlParams } from './url-params';
import { SETTINGS_DEFAULTS } from 'services/settings/utils/settings.constant';


export class UrlService {
  protected static listeners: boolean;

  static async get(): Promise<IUrlParams> {
    const settings = await SettingsService.get();

    return new UrlParams(settings, window.location.search);
  }

  static async set(params: Partial<ISettings>): Promise<void> {
    window.history.pushState(params, '', `?${this.getUrlParams(params)}`);
    window.dispatchEvent(new Event('pushstate'));
  }

  static async navigate(params: Partial<IUrlParams>): Promise<void> {
    window.location.search = this.getUrlParams(params);
  }

  protected static getUrlParams(params: Partial<ISettings>): string {
    const urlParams = new URLSearchParams(window.location.search);

    for (const name in params) {
      const key = name as keyof ISettings;
      const param = params[key];

      if (!param || params[key] === SETTINGS_DEFAULTS[key]) {
        urlParams.delete(key);
      } else {
        urlParams.set(key, param.toString());
      }
    }

    return urlParams.toString();
  }
}
