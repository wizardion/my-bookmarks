// // // Source - https://stackoverflow.com/a/68717016
// // // Posted by codermarcos, modified by community. See post 'Timeline' for change history
// // // Retrieved 2026-03-01, License - CC BY-SA 4.0

interface IAssetsInfo {
  copied: boolean;
  sourceFilename: string;
  size: number;
}

class FileListPlugin {
  apply(compiler: any) {
    compiler.hooks.done.tap(
      "Hello World Plugin",
      (
        { compilation }: { compilation: { assetsInfo: Map<string, IAssetsInfo> } }
      ) => {
        const { assetsInfo } = compilation;
        const accets = Object.keys(assetsInfo);
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const maxSize = Array.from(assetsInfo.keys())
          .reduce((a, b) => Math.max(a, b.length), 0);

        console.log('');
        console.log('Assets Info:');

        for (const [file, info] of assetsInfo) {
          const spaces = ' '.repeat((maxSize - file.length) + 2);
          const sizeType = parseInt(
            Math.floor(Math.log(info.size) / Math.log(1024)).toString()
          );
          const size = Math.round(info.size / Math.pow(1024, sizeType));

          console.log(`- ${file}:${spaces}${size} ${sizes[sizeType]}`);
        }

        console.log('');
      },
    );
  }
}

module.exports = { FileListPlugin };
