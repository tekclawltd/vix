import fs from 'fs';

import { BrowserBuildOption, FastUserConfig } from './types';

const shouldLoadjsAsJsxPlugin = (
  enabled: boolean,
  cfg: FastUserConfig
): Partial<BrowserBuildOption> =>
  enabled
    ? {
        optimizeDeps: {
          include: cfg.browserBuild.optimizeDeps?.include,
          esbuildOptions: {
            plugins: [
              {
                name: 'load-js-files-as-jsx',
                setup(build) {
                  build.onLoad({ filter: /src\/.*\.jsx?$/ }, async args => ({
                    loader: 'jsx',
                    contents: await fs.promises.readFile(args.path, 'utf8'),
                  }));
                },
              },
            ],
          },
        },
        esbuild: {
          loader: 'jsx',
          include: [/src\/.*\.jsx?$/],
          exclude: [],
        },
      }
    : {};

export { shouldLoadjsAsJsxPlugin };
