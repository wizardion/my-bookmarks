import { IBookmarksFilters } from '../models/bookmarks.models';

export const DEFAULT_FILTERS: IBookmarksFilters = {
  itemsPerPage: 10,
  page: 1,
  recursive: false,
  selectedOnly: false,
  unsuccessfulOnly: false,
  statusCode: null
};
