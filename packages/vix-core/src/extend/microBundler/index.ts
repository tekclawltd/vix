import path from 'path';
import { build, HmrContext, ViteDevServer } from '../../index';
import devServerPlugin from '../../plugins';
import { OutputOptions } from 'rollup';
import { IncomingMessage, ServerResponse } from 'http';
import { UserConfig, BuildOptions, ResolvedConfig } from 'vite';
import { FastUserConfig } from '../../plugins/coreServerPlugin/types';
import deepmerge from 'deepmerge';

export type NextFunction = (err?: any) => void;

export type RouteHandleFunction = (
  req: IncomingMessage,
  res: ServerResponse,
  next?: NextFunction
) => void;
export declare interface Options extends BuildOptions {
  entry: string | string[] | { [entryAlias: string]: string };
  output?: OutputOptions | OutputOptions[];
}
export declare interface FastResolvedConfig extends ResolvedConfig {
  fastUserConfig?: FastUserConfig;
}

export const PluginName = 'fast:client-bundler-plugin';

export default (options: Options) => {
  let command: 'build' | 'serve';
  let devServer: ViteDevServer;
  let entries: string[];
  if (typeof options.entry === 'string') {
    entries = [options.entry];
  } else if (Array.isArray(options.entry)) {
    entries = options.entry;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    entries = Object.entries(options.entry).map(([_, entry]) => entry);
  }

  const { entry, output, ...restOpts } = options;
  const buildConfig: BuildOptions = deepmerge.all([
    {
      // use 'public' as assets folder
      // avoid conflict with orch-stubs `/assets` route
      assetsDir: 'public',
      emptyOutDir: false,
      outDir: path.resolve('dist/static'),
      rollupOptions: {
        output: {
          format: 'iife',
          entryFileNames: '[name].js',
          inlineDynamicImports: true,
        },
      },
    },
    restOpts,
    {
      rollupOptions: {
        input: entry,
        output,
      },
    },
  ]);
  let microBundleConfig: UserConfig = {
    build: buildConfig,
  };

  return {
    name: PluginName,
    configResolved(resolvedConfig: FastResolvedConfig) {
      command = resolvedConfig.command;
      microBundleConfig = {
        ...resolvedConfig.fastUserConfig?.browserBuild,
        build: buildConfig,
        resolve: resolvedConfig.resolve,
        plugins: [
          ...devServerPlugin({ debug: false }, resolvedConfig.inlineConfig, command),
        ]
          .filter(Boolean)
          .flat(Number.POSITIVE_INFINITY),
      };
    },
    configureServer(server: ViteDevServer) {
      devServer = server;
      entries.forEach((entry: string) => server.watcher.add(entry));
      // dev pre build
      build(microBundleConfig);
    },

    async handleHotUpdate(ctx: HmrContext) {
      // hot reload gadget
      if ([entries.includes(ctx.file), command === 'serve'].every(Boolean)) {
        await build(microBundleConfig);
        devServer.ws.send({
          type: 'full-reload',
          path: '*',
        });
      }
    },

    closeBundle(): void {
      // prod build
      build(microBundleConfig);
    },
  };
};
