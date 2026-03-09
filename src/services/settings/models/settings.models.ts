export type ISettingEventTypes = 'update';


export type ISettingEventListener = (e?: CustomEvent<ISettings>) => void;

export interface ISettings {
  recursive: boolean;
  unsuccesfull: boolean;
  timeout: number;
  page: number;
  size: number;
}

export interface IUrlParams extends ISettings {
  levelId: number;

  has(key: string): boolean;
}
