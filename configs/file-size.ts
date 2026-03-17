interface IAssetsInfo {
  copied: boolean;
  sourceFilename: string;
  size: number;
}

interface IFile {
  name: string;
  size: number;
  sizeType: string;
}

interface IDirectories {
  [key: string]: IFile[]
}

type TAssetsInfo = Map<string, IAssetsInfo>
type COLOR =
  | 'red'
  | 'black'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'reset';

const SIZE_TYPES = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
const COLORS: Record<COLOR, string> = {
  'reset': '\x1b[0m',
  'red': '\x1b[31m',
  'black': '\x1b[30m',
  'green': '\x1b[32m',
  'yellow': '\x1b[33m',
  'blue': '\x1b[34m',
  'magenta': '\x1b[35m',
  'cyan': '\x1b[36m',
  'white': '\x1b[37m'
};

class FileListPlugin {
  private root: boolean = false;

  constructor(options: { root: boolean } = { root: false }) {
    this.root = options.root;
  }

  public apply(compiler: any): void {
    compiler.hooks.done.tap(
      "Hello World Plugin",
      (
        { compilation }: { compilation: { assetsInfo: TAssetsInfo } }
      ) => {
        const { assetsInfo } = compilation;
        const maxSize = Array.from(assetsInfo.values())
          .reduce((a, b) => Math.max(a, b.size), 0);

        if (maxSize > 0) {
          this.printAssets(assetsInfo);
        }
      },
    );
  }

  private printAssets(assetsInfo: TAssetsInfo): void {
    let total = 0;
    let maxSpaces = 0;
    const files = this.buildDirectories(assetsInfo);
    const maxLength = Array.from(assetsInfo.keys())
      .reduce((a, b) => Math.max(a, b.length), 0);

    this.logInfo('');
    this.logInfo('Assets Info:', 'cyan');

    for (const folder of Object.keys(files).sort().reverse()) {
      let tabs = '';

      if (folder !== '' && !this.root) {
        this.logInfo(`- ${folder}:`, 'black');
        tabs = ' '.repeat(4);
      }

      for (const f of files[folder]) {
        const spaces = ' '.repeat((maxLength - f.name.length) - tabs.length);
        const message = `${tabs} - ${f.name}${spaces}`;

        total += f.size;

        if (!this.root || folder === '') {
          maxSpaces = Math.max(maxSpaces, message.length);
          this.logInfo(
            [message, `${f.size} `, `${f.sizeType}`], ['green', 'yellow', 'black']
          );
        }
      }
    }

    const sizeType = parseInt(Math.floor(Math.log(total) / Math.log(1024)).toString());
    const message = 'Bundle size:'
    const spaces = ' '.repeat(maxSpaces - message.length);

    this.logInfo(
      [`${message}${spaces}`, `${total}`, ` ${SIZE_TYPES[sizeType]}`],
      ['magenta', 'white', 'black']
    );
    this.logInfo('');
  }

  private buildDirectories(assetsInfo: TAssetsInfo): IDirectories {
    const files: IDirectories = { '': [] };

    for (const [file, info] of assetsInfo) {
      const sizeType = parseInt(
        Math.floor(Math.log(info.size) / Math.log(1024)).toString()
      );
      const size = Math.round(info.size / Math.pow(1024, sizeType));

      if (file.includes('/')) {
        const paths = file.split('/');
        const fileName = paths.pop();
        const key = paths.join('/');
        const content = files[key] || [];

        content.push({
          name: `${fileName}`,
          size: size,
          sizeType: SIZE_TYPES[sizeType]
        });

        files[key] = content;
      } else {
        const content = files[''] || [];

        content.push(
          { name: `${file}`, sizeType: SIZE_TYPES[sizeType], size }
        );

        files[''] = content;
      }
    }

    return files
  }

  private logInfo(messages: string | string[], colors?: COLOR | COLOR[]): void {
    if (colors && colors instanceof Array && messages instanceof Array) {
      const log: string[] = [];

      for (let i = 0; i < colors.length; i++) {
        const message = messages[i];
        const color = colors[i];


        log.push(COLORS[color] + message)
      }

      return console.log(log.join(''), COLORS['reset']);
    }

    if (colors && !(colors instanceof Array)) {
      return console.log(COLORS[colors] + messages, COLORS['reset']);
    }

    console.log(messages);
  }
}

module.exports = { FileListPlugin };
