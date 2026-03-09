export interface IMoveInfo {
  parentId: string;
  index: number;
  oldParentId: string;
  oldIndex: number;
}

export interface IReorderInfo {
  childIds: string[];
}