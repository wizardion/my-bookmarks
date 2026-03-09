export interface IBookmarksFilters {
  page: number;
  itemsPerPage: number;
  recursive: boolean;
  selectedOnly: boolean;
  unsuccessfulOnly: boolean;
  statusCode: number | null;
}
