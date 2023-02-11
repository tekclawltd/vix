import builtins from 'builtin-modules';
import { BrowserViewConstructorOptions } from 'electron';
import { Configuration as ElectronBuilderOptions } from 'electron-builder';
import { Plugin, ResolvedConfig, ViteDevServer } from 'vite';

import { resolvePuglinConfig } from './config';
import handleBuild from './handleBuild';
import handleDev from './handleDev';
import { injectGlobalVariable } from './util';

export interface ImportMetaEnv {
  readonly DEV_SERVER_URL: string;
}

export interface PluginConfig {
  readonly mainFile?: string;
  readonly preloadFile?: string;
  readonly platforms?: readonly string[];
  readonly window?: BrowserViewConstructorOptions;
  readonly builderOptions?: ElectronBuilderOptions;
}

export interface Config extends ResolvedConfig {
  readonly pluginConfig: PluginConfig;
}

export default function viteElectron(pluginConfig: PluginConfig = {}): Plugin {
  let config: Config;

  return {
    name: '@vix-plugin:electron',
    enforce: 'pre',

    configResolved(
      resolvedConfig: ResolvedConfig & {
        electron?: PluginConfig;
      }
    ) {
      config = {
        ...resolvedConfig,
        pluginConfig: resolvePuglinConfig(pluginConfig),
      };
    },

    transformIndexHtml(html) {
      return html.replace('</head>', injectGlobalVariable(config));
    },

    configureServer(server: ViteDevServer) {
      const { httpServer } = server;
      httpServer?.on('listening', () => {
        const address: any = httpServer.address();
        // eslint-disable-next-line @microsoft/sdl/no-insecure-url
        config.env.DEV_SERVER_URL = `http://${address.address}:${address.port}`;
        handleDev(config, server);
      });
    },

    closeBundle(): void {
      config.env.DEV_SERVER_URL = null;
      handleBuild(config);
    },
    resolveId(id) {
      if (builtins.includes(id) && config.command === 'build') {
        return `__vite-browser-external:${id}`;
      }
    },

    transform(code, id) {
      const _id = id.replace('__vite-browser-external:', '');
      if (builtins.includes(_id)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const builtinMolule = require(_id);
        const keys = Object.keys(builtinMolule);
        return {
          code: `
            const m = require('${_id}');
            export const {${keys.join(', ')}} = m;        
            export default m;
          `,
        };
      }
    },
  };
}
