import './assets/styles/dialog.scss';

import { BaseElement } from '../base/base.component';
import { IDialogForm } from 'components/dialog/models/dialog.models';


const template: DocumentFragment = BaseElement.template({
  templateUrl: './dialog.component.html'
});

export class DialogElement extends BaseElement {
  static readonly selector = 'dialog-element';

  private form: IDialogForm;
  private _result: boolean;

  constructor () {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.form = {
      dialog: this.template.querySelector('dialog'),
      header: this.template.querySelector('[name="header"]'),
      message: this.template.querySelector('[name="message"]'),
      ok: this.template.querySelector('[name="ok"]'),
      cancel: this.template.querySelector('[name="cancel"]')
    };
  }

  protected eventListeners(): void {
    this.form.ok.addEventListener('click', () => this.close(true));
    this.form.cancel.addEventListener('click', () => this.close());
  }

  open(title: string, message: string): Promise<boolean | undefined> {
    this._result = false;
    this.form.header.innerText = title;
    this.form.message.innerText = message;

    this.form.dialog.showModal();
    this.form.dialog.classList.toggle('open');
    this.form.ok.focus();

    return new Promise<boolean>((resolve) => {
      const event = () => {
        this.form.dialog.removeEventListener('close', event);
        this.form.dialog.classList.toggle('open');

        resolve(this._result);
      };

      this.form.dialog.addEventListener('close', event);
    });
  }

  async close(result = false) {
    this._result = result;
    this.form.dialog.close();
  }
}
