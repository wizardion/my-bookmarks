export interface IPaginationForm {
  first?: HTMLButtonElement;
  next: HTMLButtonElement;
  fieldset: HTMLFieldSetElement;
  prev: HTMLButtonElement;
  last?: HTMLButtonElement;
  pageSize: HTMLSelectElement;

  pages?: HTMLButtonElement[];
  current?: HTMLButtonElement;
}
