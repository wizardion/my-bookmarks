import './assets/styles/bookmark-controls.scss';

import { delay } from 'core/index';
import { BaseElement } from '../base.component';


const template: DocumentFragment = BaseElement.template({
  templateUrl: './bookmark-controls.component.html'
});

export class BookmarkControlsElement extends BaseElement {
  static readonly selector = 'bookmark-controls';

  private sync: HTMLButtonElement;
  private _url: string;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.sync = this.template.querySelector('[name="sync"]');
  }

  protected eventListeners(): void {
    this.sync.addEventListener('click', () => this.checkLink());
  }

  set url(value: string) {
    this._url = value;
  }

  async checkLink() {
    this.sync.classList.toggle('processing');
    this.sync.disabled = true;
    console.log('checkLink');

    await delay(1000);

    this.sync.disabled = false;
    this.sync.classList.toggle('processing');
    this.sync.classList.toggle('success');
  }
}
