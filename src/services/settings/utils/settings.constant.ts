import { ISettings } from '../models/settings.models';

export const SETTINGS_DEFAULTS: ISettings = {
  recursive: false,
  unsuccesfull: false,
  timeout: 30,
  size: 100,
  page: 1,
};
