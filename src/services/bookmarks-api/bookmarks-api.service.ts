
import { IBookmarkLevel } from 'services/indexed-db/models/db.models';
import { IBookmarkTreeNode } from './models/bookmarks-api.models';

export const MAX_BOOKMARKS_AMOUNT = 100;

export class BookmarksAPIService {
  public async get(id: number): Promise<IBookmarkTreeNode> {
    const [bookmark] = await chrome.bookmarks.get(String(id));

    return bookmark;
  }

  public async getChildren(id: number, recursive?: boolean): Promise<IBookmarkTreeNode[]> {
    const children = (await chrome.bookmarks.getChildren(String(id)))
      .map<Promise<IBookmarkTreeNode>>(async (i) => {
        return { ...i, levels: await this.getLevels(i) };
      });

    if (recursive) {
      let nodes: IBookmarkTreeNode[] = [];

      for (let i = 0; i < children.length; i++) {
        const bookmark = await children[i];

        nodes.push(bookmark);

        if (!bookmark.url) {
          nodes = nodes.concat(await this.getChildren(Number(bookmark.id), recursive));
        }
      }

      return nodes;
    }

    return Promise.all(children);
  }

  public async remove(id: number): Promise<void> {
    return chrome.bookmarks.remove(String(id));
  }

  private async getLevels(bookmark: IBookmarkTreeNode): Promise<IBookmarkLevel[]> {
    try {
      const levels: IBookmarkLevel[] = [];

      while (bookmark && bookmark.parentId) {
        levels.push({ id: bookmark.id, title: bookmark.title });
        bookmark = await this.get(Number(bookmark.parentId));
      }

      return levels;
    } catch (error) {
      console.log('Error getting bookmark path', error);

      return [];
    }
  }
}
