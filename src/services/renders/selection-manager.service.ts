import { BookmarkRenderEvents } from './models/bookmarks.models';

export class SelectionManager {
  private static selectedIds = new Set<number>();

  public static toggle(id: number, isSelected: boolean) {
    if (isSelected) { this.selectedIds.add(id); }
    else { this.selectedIds.delete(id); }

    // Broadcast the NEW total count so the "Check Selected" button can update
    window.dispatchEvent(new CustomEvent(BookmarkRenderEvents.SELECTION_CHANGE, {
      detail: this.selectedIds.size
    }));
  }

  public static getSelectedIds(): number[] {
    return Array.from(this.selectedIds);
  }

  public static clear() {
    this.selectedIds.clear();
    window.dispatchEvent(
      new CustomEvent(BookmarkRenderEvents.SELECTION_CHANGE, { detail: 0 })
    );
  }
}

// private static async handleSelection(
//   id: number,
//   selected: boolean,
//   type: BookmarkTypes
// ) {
//   if (type === BookmarkTypes.FOLDER) {
//     const service = new BookmarksService(new IndexedDBManager());
//     const items = await service.getChildren(id, true);

//     for (const item of items) {
//       const element = document.getElementById(item.id.toString()) a
// s IBookmarkElement;

//       if (element) {
//         element.selected = selected;
//       }

//       if (selected) {
//         this.selection.add(item.id);
//       } else {
//         this.selection.delete(item.id);
//       }
//     }
//   }

//   if (selected) {
//     this.selection.add(id);
//   } else {
//     this.selection.delete(id);
//   }

//   this.dispatchEvent('selection-change', this.selection.size);
// }
