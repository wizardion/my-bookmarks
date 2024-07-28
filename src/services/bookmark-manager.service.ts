import { IBookmarkNode, IEventListener } from 'core';


export class BookmarkManager {
  static selection = new Map<number, IBookmarkNode>();
  private static listeners = new Map<'select', IEventListener>();

  public static select(item: IBookmarkNode): void {
    this.selection.set(Number(item.id), item);

    this.onSelectionChange();
  }

  public static unselect(id: string | number): void {
    this.selection.delete(Number(id));

    this.onSelectionChange();
  }

  public static async removeSelected() {
    console.log('removeSelected');
  }

  public static addEventListener(type: 'select', listener: IEventListener): void {
    if (type === 'select') {
      this.listeners.set(type, () => listener());
    }
  }

  private static onSelectionChange() {
    const listener = this.listeners.get('select');

    if (listener) {
      listener();
    }
  }
}
