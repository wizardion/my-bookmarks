// // import {
// //   BookmarkTypes, delay, IBookmarkNode, IBookmarkResponse, IBookmarkStatus,
// //   IEventListener, ResponseStatuses
// // } from 'core';
// // import {
// //   IBookmarkLevel, IBookmarkTreeNode, ResponseStatusCodes
// // } from 'core/models/core.models';
// // import { BookmarkRenderService } from 'services/bookmarks-api/bookmarks-render.service';


// export class BookmarksAPIManager2 {
//   static selection = new Set<number>();
//   static bookmarks: Map<number, IBookmarkNode>;

//   private static filtered: Map<number, IBookmarkNode> | null = null;
//   private static listeners = new Map<'select', IEventListener>();


//   public static setSelection(id: number, value: boolean) {
//     const bookmark = this.bookmarks.get(id);

//     if (bookmark) {
//       bookmark.selected = value;

//       if (bookmark.selected) {
//         this.selection.add(id);
//       } else {
//         this.selection.delete(id);
//       }

//       this.onSelectionChange();
//     }
//   }

//   public static getSelectedItems() {
//     return Array.from(
//       this.selection.values()
//     ).map(i => this.bookmarks.get(i)).filter(i => !!i.url);
//   }

//   public static getItems() {
//     return Array.from(this.bookmarks.values()).filter(i => !!i.url);
//   }

//   public static async loadData(
//     levelId: number,
//     start: number,
//     count: number,
//     recursive: boolean,
//     rebind?: boolean,
//     filtered?: boolean
//   ): Promise<IBookmarkNode[]> {
//     if (rebind || !this.bookmarks) {
//       const item = await this.loadBookmarks(levelId, recursive);

//       this.filtered = null;
//       this.bookmarks = new Map<number, IBookmarkNode>(item.map(i => [i.id, i]));
//     } else if (filtered && !this.filtered) {
//       const items = Array.from(this.bookmarks.values())
//         .filter(i => i.status?.ok === false);

//       this.filtered = this.bookmarks;
//       this.bookmarks = new Map<number, IBookmarkNode>(items.map(i => [i.id, i]));
//     } else if (!filtered && this.filtered) {
//       this.bookmarks = this.filtered;
//       this.filtered = null;
//     }

//     return Array.from(this.bookmarks.values())
//       .slice(start, Math.min(this.bookmarks.size, start + count));
//   }

//   public static async removeSelected(progress: (i: number, t: number) => void) {
//     const total = this.selection.size;
//     const ids = Array.from(this.selection.values());

//     for (let i = 0; i < ids.length; progress(++i, total)) {
//       const bookmark = await this.getBookmark(ids[i]);

//       if (bookmark && this.bookmarks.has(bookmark.id)) {
//         if (BookmarkRenderService.recursive && !bookmark.url) {
//           const subItems = await this.loadBookmarks(bookmark.id, true);
//           const selected = subItems.filter(i => this.selection.has(Number(i.id)));

//           if (selected.length === subItems.length) {
//             await chrome.bookmarks.removeTree(bookmark.id.toString());
//             selected.forEach(i => this.bookmarks.delete(Number(i.id)));
//             selected.forEach(i => this.filtered?.delete(Number(i.id)));
//             this.bookmarks.delete(Number(bookmark.id));
//             this.filtered?.delete(Number(bookmark.id));
//           } else {
//             this.bookmarks.get(bookmark.id).selected = false;
//           }
//         } else if (!bookmark.url) {
//           await chrome.bookmarks.removeTree(bookmark.id.toString());
//           this.bookmarks.delete(bookmark.id);
//           this.filtered?.delete(bookmark.id);
//         } else {
//           await chrome.bookmarks.remove(bookmark.id.toString());
//           this.bookmarks.delete(bookmark.id);
//           this.filtered?.delete(bookmark.id);
//         }

//         await delay(10);
//       }
//     }

//     await delay(1250);
//     this.selection.clear();
//     this.onSelectionChange();
//   }

//   public static addEventListener(type: 'select', listener: IEventListener): void {
//     if (type === 'select') {
//       this.listeners.set(type, () => listener());
//     }
//   }

//   private static onSelectionChange() {
//     const listener = this.listeners.get('select');

//     if (listener) {
//       listener();
//     }
//   }

//   private static async loadBookmarks(
//     id: number,
//     recursive?: boolean, level = 0
//   ): Promise<IBookmarkNode[]> {
//     let children: IBookmarkTreeNode[];
//     const levels = await this.getBookmarkLevels(id);

//     try {
//       children = await chrome.bookmarks.getChildren(String(id));
//     } catch (error) {
//       console.log('error:', error);
//       children = [];
//     }

//     if (recursive) {
//       let results: IBookmarkNode[] = [];

//       for (let i = 0; i < children.length; i++) {
//         const bookmark = children[i];
//         const node: IBookmarkNode = {
//           id: Number(bookmark.id),
//           level: level,
//           title: bookmark.title,
//           type: bookmark.url ? BookmarkTypes.LINK : BookmarkTypes.FOLDER,
//           url: bookmark.url,
//           path: levels
//         };

//         results.push(node);

//         if (!node.url) {
//           results = results.concat(
//             await this.loadBookmarks(Number(bookmark.id), recursive, level + 1)
//           );
//         }
//       }

//       return results;
//     }

//     return children.map(i => ({
//       id: Number(i.id),
//       level: level,
//       title: i.title,
//       type: i.url ? BookmarkTypes.LINK : BookmarkTypes.FOLDER,
//       url: i.url,
//       path: levels
//     }));
//   }

//   private static async getBookmark(id: number): Promise<IBookmarkNode | null> {
//     try {
//       const [item] = await chrome.bookmarks.get(id.toString());

//       return {
//         id: Number(item.id),
//         level: 0,
//         title: item.title,
//         type: item.url ? BookmarkTypes.LINK : BookmarkTypes.FOLDER,
//         url: item.url,
//         path: []
//       };
//     } catch (error) {
//       console.log('error', error);

//       return null;
//     }
//   }

//   private static async getBookmarkLevels(
//     id: number | string
//   ): Promise<IBookmarkLevel[]> {
//     try {
//       const levels: IBookmarkLevel[] = [];
//       let [bookmark] = await chrome.bookmarks.get(String(id));

//       while (bookmark && bookmark.parentId) {
//         levels.push({ id: bookmark.id, title: bookmark.title });
//         [bookmark] = await chrome.bookmarks.get(bookmark.parentId);
//       }

//       return levels;
//     } catch (error) {
//       console.log('Error getting bookmark path', error);

//       return [];
//     }
//   }


// }
