import { ISettings, IUrlParams } from 'services/settings/models/settings.models';
import { SETTINGS_DEFAULTS } from 'services/settings/utils/settings.constant';

export class UrlParams implements IUrlParams {
  recursive: boolean;
  unsuccesfull: boolean;
  timeout: number;
  page: number;
  size: number;
  levelId: number;

  private urlParams: URLSearchParams;

  constructor(settings: ISettings, params: string) {
    this.urlParams = new URLSearchParams(params);

    this.timeout = settings.timeout;
    this.unsuccesfull = this.urlParams.get('unsuccesfull') === 'true';
    this.size = Number(this.urlParams.get('size')) || settings.size;
    this.page = Number(this.urlParams.get('page') || '1') || SETTINGS_DEFAULTS.page;
    this.recursive = this.urlParams.get('recursive') === 'true' || settings.recursive;
    this.levelId = Number(this.urlParams.get('id') || '0');
  }

  has(key: string): boolean {
    return this.urlParams.has(key);
  }
}
