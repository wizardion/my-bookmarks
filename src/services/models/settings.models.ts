export type ISettingEventTypes = 'update';


export type ISettingEventListener = (e?: CustomEvent<ISettings>) => void;

export interface ISettings {
  recursive: boolean;
  timeout: number;
}
