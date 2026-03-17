export interface IBookmarksFilters {
  page: number;
  itemsPerPage: number;
  recursive: boolean;
  selectedOnly: boolean;
  unsuccessfulOnly: boolean;
  statusCode: number | null;
}

export const BookmarkRenderEvents = {
  RENDER_COMPLETE: 'render-complete',
  SELECTION_CHANGE: 'selection-change',
} as const;

export interface BookmarkRenderEventMap {
  [BookmarkRenderEvents.RENDER_COMPLETE]: CustomEvent<number>;
  [BookmarkRenderEvents.SELECTION_CHANGE]: CustomEvent<number>;
}

declare global {
  interface WindowEventMap {
    [BookmarkRenderEvents.RENDER_COMPLETE]: BookmarkRenderEventMap[
    typeof BookmarkRenderEvents.RENDER_COMPLETE
    ];
    [BookmarkRenderEvents.SELECTION_CHANGE]: BookmarkRenderEventMap[
    typeof BookmarkRenderEvents.SELECTION_CHANGE
    ];
  }
}
