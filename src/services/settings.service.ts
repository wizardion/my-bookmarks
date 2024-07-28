import { IEventListener } from 'core/index';
import { ISettingEventTypes, ISettings } from './models/settings.models';


export const defaultSettings: ISettings = {
  recursive: false,
};


export class SettingsService {
  private static name = 'SettingsService';
  private static listeners = new Map<ISettingEventTypes, IEventListener[]>();

  static async get(): Promise<ISettings> {
    console.log('chrome.storage', chrome.storage);

    const settings = await chrome.storage.local.get(this.name);

    return settings[this.name] || defaultSettings as ISettings;
  }

  static async set(value: ISettings): Promise<void> {
    chrome.storage.local.set({ [this.name]: value });

    this.onEventHandler('update', value);
  }

  static addEventListener(type: ISettingEventTypes, listener: IEventListener) {
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
