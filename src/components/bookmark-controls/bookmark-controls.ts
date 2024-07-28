import './assets/styles/bookmark-controls.scss';

import { BaseElement } from '../base/base.component';
import { IBookmarkStatus, STATUSES } from 'components/models/bookmark.models';


const template: DocumentFragment = BaseElement.template({
  templateUrl: './bookmark-controls.html'
});

export class BookmarkControlsElement extends BaseElement {
  static readonly selector = 'bookmark-controls';
  static readonly observedAttributes = ['controls'];

  private _checkbox: HTMLInputElement;
  private _sync: HTMLButtonElement;

  constructor () {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this._checkbox = this.template.querySelector('[name="select"]');
    this._sync = this.template.querySelector('[name="status"]');
  }

  protected attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'controls') {
      const controls = newValue.split(',');

      for (let i = 0; i < controls.length; i++) {
        const control = controls[i];

        if (control === 'select') {
          this._checkbox.hidden = false;
        }

        if (control === 'check') {
          this._sync.hidden = false;
        }
      }
    }
  }

  reset() {
    this._sync.classList.remove(...Object.keys(STATUSES));
  }

  get sync(): HTMLButtonElement {
    return this._sync;
  }

  get checkbox(): HTMLInputElement {
    return this._checkbox;
  }

  set status(value: IBookmarkStatus) {
    this._sync.classList.toggle(value.class);
    this._sync.setAttribute('title', value.title);
    this._sync.disabled = false;
  }

  set animating(animate: boolean) {
    const elements = this._sync.getElementsByTagName('animate');

    if (animate) {
      this._sync.classList.remove(...Object.keys(STATUSES));
      this.startAnimations(elements);
    } else {
      this.stopAnimations(elements);
    }
  }

  private startAnimations(animateElements: HTMLCollectionOf<SVGAnimateElement>) {
    for (let i = 0; i < animateElements.length; i++) {
      const element = animateElements.item(i);

      element.beginElement();
    }
  }

  private stopAnimations(animateElements: HTMLCollectionOf<SVGAnimateElement>) {
    for (let i = 0; i < animateElements.length; i++) {
      const element = animateElements.item(i);

      element.endElement();
    }
  }
}
