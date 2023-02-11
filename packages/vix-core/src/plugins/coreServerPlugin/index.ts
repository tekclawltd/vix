import colors from 'picocolors';
import deepmerge from 'deepmerge';
import { analyzeMetafile } from 'esbuild';
import fse from 'fs-extra';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

import buildServer from '../../buildServer';
import { makeLogger } from '../../utils';
import constructEnvironments from './constructEnv';
import { createMiddleware } from './createMiddleware';
import { shouldLoadjsAsJsxPlugin } from './presets';
import { CLI_ALIAS, PLUGIN_NAME, ServerPlugin, FastUserConfig } from './types';

const startTime = Date.now();

export default function serverPlugin(cfg: FastUserConfig = {}): Plugin[] {
  const config: FastUserConfig = cfg;
  const { devServer, browserBuild, presets = {}, hooks = {} } = config;
  const { onBefore } = hooks;
  const {
    entry: developmentServerEntry,
    envs,
    ...serverOptions
  } = devServer || {};
  let command: string;
  const { outDir, ...viteOptions } = browserBuild || {};
  const { loggerPrefix, forceLoadJsAsJsx = false } = presets;
  const logger = makeLogger({
    logLevel: 'info',
    loggerPrefix: loggerPrefix || `[${CLI_ALIAS}]`,
  });
  const plugins: Plugin[] = [
    {
      name: PLUGIN_NAME,
      // put core plugin to post order
      // https://vitejs.dev/guide/api-plugin.html#plugin-ordering
      enforce: 'pre',
      config: () => {
        constructEnvironments(config, envs);
        onBefore && onBefore(config);
        const viteConfig = deepmerge.all(
          [
            defineConfig({
              customLogger: logger,
              cacheDir: path.resolve(
                process.cwd(),
                `node_modules/.${CLI_ALIAS}`
              ),
            }) as any,
            shouldLoadjsAsJsxPlugin(forceLoadJsAsJsx, cfg),
            outDir && {
              build: {
                emptyOutDir: true,
                outDir,
              },
            },
            viteOptions,
            {
              server: serverOptions,
              fastUserConfig: config,
            },
          ].filter(Boolean)
        );
        return viteConfig;
      },
      getUserConfig(): FastUserConfig {
        return config;
      },
      configResolved: (resolvedConfig) => {
        command = resolvedConfig.command;
      },
      configureServer: (server) => {
        if ([command === 'serve', developmentServerEntry].every(Boolean)) {
          server.middlewares.use(createMiddleware(server));
          devServer.routes && Object.entries(devServer.routes)
          .forEach(([routePath, handler]) => {
              server.middlewares.use(routePath, handler);
          });
        }
      },
      closeBundle: async () => {
        let report, result;
        const { serverBuild, hooks = {} } = config;
        const { onEnd } = hooks;
        if ([serverBuild, serverBuild?.entry].every(Boolean)) {
          const { metafile, entry, ...restServerBuild } = serverBuild!;
          let serverBuildOptions: any = restServerBuild;
          let metaOutputFile: string | null = null;
          let outdir: string | null = null;

          if (Array.isArray(entry)) {
            outdir = serverBuild!.outdir || './dist';
            metaOutputFile = 'build.meta.json';
            serverBuildOptions = { ...restServerBuild, outdir, entry };
          } else {
            const { outfile } = serverBuild!;
            const fileName: string = (outfile || (entry as string))!;
            const distFileName = path.parse(fileName).name;
            metaOutputFile = `${distFileName}.meta.json`;
            const outputFile = outfile || `./dist/${distFileName}.js`;
            outdir = path.dirname(outputFile);
            serverBuildOptions = {
              ...restServerBuild,
              outfile: outputFile,
              entry,
            };
          }

          result = await buildServer({
            ...cfg,
            serverBuild: serverBuildOptions,
          });
          if (metafile) {
            report = await analyzeMetafile(result.metafile!, {
              color: true,
            });
            logger.info(report);
            await fse.writeJSON(outdir + '/' + metaOutputFile, result.metafile);
          }
          const printReport = (metafile: any) => {
            logger.info(colors.bold('\nServer Build:'));
            const { outputs } = metafile;
            const indents = '               ';
            const formatOutput = (key: string) =>
              logger.info(
                colors.green(
                  `${key}${indents}${outputs[key].bytes / 1000}Kib`
                )
              );
            for (const key of Object.keys(outputs)) {
              formatOutput(key);
            }
          };
          result?.metafile && printReport(result.metafile);
        }

        onEnd && (await onEnd(config));

        const endTime = (Date.now() - startTime) / 1000;
        logger.info(
          colors.green(`successfully built, total spent ${endTime}s\n`),
          { timestamp: true }
        );
      },
    } as ServerPlugin,
  ];

  return plugins;
}
