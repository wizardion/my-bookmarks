export interface IBookmarkForm {
  controls: {
    sync: {
      button: HTMLButtonElement;
      icons: Record<string, SVGAElement>;
    };
    delete: HTMLButtonElement;
  },
  bookmark: HTMLElement;
  link: HTMLLinkElement;
}
