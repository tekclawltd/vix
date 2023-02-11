import fs from 'fs-extra';
import type { Plugin } from 'vite';
import { CLI_ALIAS } from '../../types';
import path from 'path';
import colors from 'picocolors';

export const PLUGIN_NAME = `${CLI_ALIAS}:core-optimize-persist-plugin`;

export interface Options {
  /**
   * Milliseconds to wait before writing the package.json file.
   *
   * @default 1000
   */
  delay?: number;

  /**
   * Filter predictor for modules to include
   *
   * @default truthy predictor
   */
  filter?: (includeModule: string) => boolean;
}

function optimizePersistPlugin({
  delay = 1000,
  filter = () => true,
}: Options = {}): Plugin {
  let cacheConfig;
  return <Plugin>{
    name: PLUGIN_NAME,
    enforce: 'post',
    apply: 'serve',
    configResolved(resolvedConfig) {
      cacheConfig = {
        cacheJsonPath: path.join(
          resolvedConfig.cacheDir,
          CLI_ALIAS + '.optimizeDeps.json'
        ),
        field: CLI_ALIAS,
      };
    },
    configureServer(server) {
      // @ts-expect-error
      let optimizeDepsMetadata: any = server._ssrExternals;
      const forceIncluded = server.config?.optimizeDeps?.include || [];
      let newDeps: string[] = [];
      let timer: any;
      const { info } = server.config.logger;
      async function write() {
        if (!newDeps.length) return;

        info(colors.green(`writting to ${cacheConfig.cacheJsonPath}`), {
          timestamp: true,
        });
        const isCacheConfigExist = fs.existsSync(cacheConfig.cacheJsonPath);
        const pkg = isCacheConfigExist
          ? await fs.readJSON(cacheConfig.cacheJsonPath)
          : {};
        pkg[cacheConfig.field] = pkg[cacheConfig.field] || {};
        const extend = pkg[cacheConfig.field];
        extend.optimizeDeps = extend.optimizeDeps || {};
        extend.optimizeDeps.include = Array.from(
          new Set([...(extend.optimizeDeps.include || []), ...newDeps])
        );
        extend.optimizeDeps.include.sort();
        server.watcher.unwatch(cacheConfig.cacheJsonPath);
        await fs.writeJSON(cacheConfig.cacheJsonPath, pkg, { spaces: 2 });
        server.watcher.add(cacheConfig.cacheJsonPath);
        info(colors.green('optimized deps cache written!'), {
          timestamp: true,
        });
      }

      function update() {
        newDeps = Object.keys(optimizeDepsMetadata?.optimized || {})
          .filter(i => !forceIncluded.includes(i))
          .filter(filter);
        info(colors.green(`new deps: ${newDeps.join(', ')}`), {
          timestamp: true,
        });

        clearTimeout(timer);
        timer = setTimeout(write, delay);
      }

      Object.defineProperty(server, '_optimizeDepsMetadata', {
        get() {
          return optimizeDepsMetadata;
        },
        set(v) {
          optimizeDepsMetadata = v;
          update();
        },
      });
    },
  };
}

export default optimizePersistPlugin;
