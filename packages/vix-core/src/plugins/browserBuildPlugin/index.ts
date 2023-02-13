import deepmerge from 'deepmerge';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { shouldLoadjsAsJsxPlugin } from './presets';
import { PLUGIN_NAME, CLI_ALIAS, ServerPlugin, FastUserConfig } from './types';

export default function browserBuildPlugin(cfg: FastUserConfig = {}): Plugin[] {
  const { browserBuild, presets = {} } = cfg;
  const { ...viteOptions } = browserBuild || {};
  const { forceLoadJsAsJsx = false } = presets;

  const plugins: Plugin[] = [
    {
      name: PLUGIN_NAME,
      // put core plugin to post order
      // https://vitejs.dev/guide/api-plugin.html#plugin-ordering
      enforce: 'pre',
      config: () => {
        const viteConfig = deepmerge.all(
          [
            defineConfig({
              cacheDir: path.resolve(
                process.cwd(),
                `node_modules/.${CLI_ALIAS}`
              ),
            }) as any,
            shouldLoadjsAsJsxPlugin(forceLoadJsAsJsx, cfg),
            viteOptions,
            {
              fastUserConfig: cfg,
            },
          ].filter(Boolean)
        );
        return viteConfig;
      },
      getUserConfig(): FastUserConfig {
        return cfg;
      },
    } as ServerPlugin,
  ];

  return plugins;
}
