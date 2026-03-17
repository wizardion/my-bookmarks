export type ISettingEventTypes = 'update';

export interface ISettings {
  recursive: boolean;
  unsuccesfull: boolean;
  timeout: number;
  page: number;
  size: number;
};
