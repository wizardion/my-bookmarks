export type IEventListener = (e?: Event) => void;

export enum AppMessageTypes {
  ADD = 1,
  REMOVE = 2,
  CHANGE = 3
}

export interface IAppMessage {
  ids: number[];
  type: AppMessageTypes;
}
