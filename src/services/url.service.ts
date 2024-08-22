import { ISettings, IUrlParams } from './models/settings.models';
import { defaultSettings, SettingsService } from './settings.service';


export class UrlService {
  protected static listeners: boolean;

  static async get(): Promise<IUrlParams> {
    const settings = await SettingsService.get();
    const urlParams = new URLSearchParams(window.location.search);

    return {
      timeout: settings.timeout,
      size: Number(urlParams.get('size')) || settings.size,
      page: Number(urlParams.get('page') || '1') || defaultSettings.page,
      recursive: urlParams.get('recursive') === 'true' || settings.recursive,
      levelId: urlParams.get('id') || '0',
      has: (key) => urlParams.has(key)
    };
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

      if (!param || params[key] === defaultSettings[key]) {
        urlParams.delete(key);
      } else {
        urlParams.set(key, param.toString());
      }
    }

    return urlParams.toString();
  }
}
