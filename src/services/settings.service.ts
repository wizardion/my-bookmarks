import { ISettingEventListener, ISettingEventTypes, ISettings } from './models/settings.models';


export const defaultSettings: ISettings = {
  recursive: false,
  timeout: 30
};


export class SettingsService {
  private static name = 'SettingsService';
  private static listeners = new Map<ISettingEventTypes, ISettingEventListener[]>();

  static async get(): Promise<ISettings> {
    const settings = await chrome.storage.local.get(this.name);

    return settings[this.name] || defaultSettings as ISettings;
  }

  static async set(value: ISettings): Promise<void> {
    chrome.storage.local.set({ [this.name]: value });

    this.onEventHandler('update', value);
  }

  static async clear(): Promise<void> {
    return chrome.storage.local.remove(this.name);
  }

  static addEventListener(type: ISettingEventTypes, listener: ISettingEventListener) {
    if (type === 'update') {
      const handlers = this.listeners.get(type) || [];

      handlers.push(listener);
      this.listeners.set(type, handlers);
    }
  }

  private static onEventHandler(type: ISettingEventTypes, value: ISettings) {
    const listeners = this.listeners.get(type);

    if (listeners) {
      const event = new CustomEvent(type, { detail: value });

      listeners.forEach(listener => listener(event));
    }
  }
}
