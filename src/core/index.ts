export { IBookmarkNode, IEventListener } from './models/core.models';

export function delay(milliseconds: number = 200): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}