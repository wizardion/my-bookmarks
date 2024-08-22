import { ISettings } from './models/settings.models';


export const defaultSettings: ISettings = {
  recursive: false,
  timeout: 30,
  size: 100,
  page: 1,
};


export class SettingsService {
  private static settings: ISettings;
  private static name = 'SettingsService';

  static async get(): Promise<ISettings> {
    let settings = this.settings
      || ((await chrome.storage.local.get(this.name) || {})[this.name]) as ISettings;

    if (!settings) {
      settings = defaultSettings;
    }

    return {
      recursive: settings.recursive,
      timeout: settings.timeout,
      size: settings.size,
      page: settings.page,
    };
  }

  static async set(value: ISettings): Promise<void> {
    this.settings = value;
    chrome.storage.local.set({ [this.name]: value });
  }

  static async clear(): Promise<void> {
    return chrome.storage.local.remove(this.name);
  }
}
