import path from 'node:path';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { cac } from 'cac';
import colors from 'picocolors';
import type { BuildOptions } from 'vite';
import type { ServerOptions } from 'vite';
import { createLogger } from 'vite'
import { resolveConfig, createServer, build, optimizeDeps, preview } from 'vite';
import shelljs from 'shelljs';
import getConfig from './getConfig';
import { GlobalCLIOptions } from './types';


const VERSION = require('../package.json').version;
let profileSession = global.__vite_profile_session;
let profileCount = 0;

export const stopProfiler = (
  log: (message: string) => void,
): void | Promise<void> => {
  if (!profileSession) return;
  return new Promise((res, rej) => {
    profileSession!.post('Profiler.stop', (err: any, { profile }: any) => {
      // Write profile to disk, upload, etc.
      if (!err) {
        const outPath = path.resolve(`./vite-profile-${profileCount++}.cpuprofile`);
        fs.writeFileSync(outPath, JSON.stringify(profile));
        log(
          colors.yellow(`CPU profile written to ${colors.white(colors.dim(outPath))}`)
        );
        profileSession = undefined;
        res();
      } else {
        rej(err);
      }
    })
  })
}

const filterDuplicateOptions = <T extends object>(options: T) => {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key as keyof T] = value[value.length - 1];
    }
  }
}

export const createCli = (cliName: string, configPath?: string) => {
  const cli = cac(cliName);

  cli
    .option('-c, --config <file>', `[string] use specified config file`, {
      default: configPath || `${cliName}.config.ts`,
    })
    .option('--base <path>', `[string] public base path (default: /)`)
    .option('-l, --logLevel <level>', `[string] info | warn | error | silent`)
    .option('--clearScreen', `[boolean] allow/disable clear screen when logging`)
    .option('-d, --debug [feat]', `[string | boolean] show debug logs`)
    .option('-f, --filter <filter>', `[string] filter debug logs`)
    .option('-m, --mode <mode>', `[string] set env mode`)

  // dev
  cli
    .command('[root]', 'start dev server') // default command
    .alias('serve') // the command is called 'serve' in Vite's API
    .alias('dev') // alias to align with the script name
    .option('--host [host]', `[string] specify hostname`)
    .option('--port <port>', `[number] specify port`)
    .option('--https', `[boolean] use TLS + HTTP/2`)
    .option('--open [path]', `[boolean | string] open browser on startup`)
    .option('--cors', `[boolean] enable CORS`)
    .option('--strictPort', `[boolean] exit if specified port is already in use`)
    .option(
      '--force',
      `[boolean] force the optimizer to ignore the cache and re-bundle`,
    )
    .action(async (root: string, options: ServerOptions & GlobalCLIOptions) => {
      filterDuplicateOptions(options);
      // output structure is preserved even after bundling so require()
      // is ok here
      const config = await getConfig(options as any,
        'serve'
      );
      try {
        const server = await createServer(config);

        if (!server.httpServer) {
          throw new Error('HTTP server not available');
        }

        await server.listen();

        const info = server.config.logger.info;

        const viteStartTime = global.__vite_start_time ?? false;
        const startupDurationString = viteStartTime
          ? colors.dim(
            `ready in ${colors.reset(colors.bold(Math.ceil(performance.now() - viteStartTime)))} ms`,
          )
          : '';

        info(
          `\n  ${colors.green(
            `${colors.bold(cliName)} v${VERSION}`,
          )}  ${startupDurationString}\n`,
          { clear: !server.config.logger.hasWarned }
        );

        server.printUrls();
        // bindShortcuts(server, {
        //   print: true,
        //   customShortcuts: [
        //     profileSession && {
        //       key: 'p',
        //       description: 'start/stop the profiler',
        //       async action(server) {
        //         if (profileSession) {
        //           await stopProfiler(server.config.logger.info)
        //         } else {
        //           const inspector = await import('node:inspector').then(
        //             (r) => r.default,
        //           )
        //           await new Promise<void>((res) => {
        //             profileSession = new inspector.Session()
        //             profileSession.connect()
        //             profileSession.post('Profiler.enable', () => {
        //               profileSession!.post('Profiler.start', () => {
        //                 server.config.logger.info('Profiler started')
        //                 res()
        //               })
        //             })
        //           })
        //         }
        //       },
        //     },
        //   ],
        // })
      } catch (e) {
        const logger = createLogger(options.logLevel);
        logger.error(colors.red(`error when starting dev server:\n${e.stack}`), {
          error: e,
        });
        stopProfiler(logger.info);
        process.exit(1);
      }
    })

  // build
  cli
    .command('build [root]', 'build for production')
    .option('--target <target>', `[string] transpile target (default: 'modules')`)
    .option('--outDir <dir>', `[string] output directory (default: dist)`)
    .option(
      '--assetsDir <dir>',
      `[string] directory under outDir to place assets in (default: assets)`,
    )
    .option(
      '--assetsInlineLimit <number>',
      `[number] static asset base64 inline threshold in bytes (default: 4096)`,
    )
    .option(
      '--ssr [entry]',
      `[string] build specified entry for server-side rendering`,
    )
    .option(
      '--sourcemap',
      `[boolean] output source maps for build (default: false)`,
    )
    .option(
      '--minify [minifier]',
      `[boolean | "terser" | "esbuild"] enable/disable minification, ` +
      `or specify minifier to use (default: esbuild)`,
    )
    .option('--manifest [name]', `[boolean | string] emit build manifest json`)
    .option('--ssrManifest [name]', `[boolean | string] emit ssr manifest json`)
    .option(
      '--force',
      `[boolean] force the optimizer to ignore the cache and re-bundle (experimental)`,
    )
    .option(
      '--emptyOutDir',
      `[boolean] force empty outDir when it's outside of root`,
    )
    .option('-w, --watch', `[boolean] rebuilds when modules have changed on disk`)
    .action(async (root: string, options: BuildOptions & GlobalCLIOptions) => {
      filterDuplicateOptions(options);
      const config = await getConfig(options as any,
        'build'
      );
      try {
        await build(config);

      } catch (e) {
        createLogger(options.logLevel).error(
          colors.red(`error during build:\n${e.stack}`),
          { error: e },
        );
        process.exit(1);
      } finally {
        stopProfiler((message) => createLogger(options.logLevel).info(message));
      }
    })

  // optimize
  cli
    .command('optimize [root]', 'pre-bundle dependencies')
    .option(
      '--force',
      `[boolean] force the optimizer to ignore the cache and re-bundle`,
    )
    .action(
      async (root: string, options: { force?: boolean } & GlobalCLIOptions) => {
        filterDuplicateOptions(options);
        const userConfig = await getConfig(
          {
            ...options,
            root,
            mode: 'production',
          },
          'serve'
        );
        try {
          const config = await resolveConfig(
            userConfig,
            'serve',
          )
          await optimizeDeps(config, options.force, true);
        } catch (e) {
          createLogger(options.logLevel).error(
            colors.red(`error when optimizing deps:\n${e.stack}`),
            { error: e },
          );
          process.exit(1);
        }
      },
    )

  cli
    .command('preview [root]', 'locally preview production build')
    .option('--host [host]', `[string] specify hostname`)
    .option('--port <port>', `[number] specify port`)
    .option('--strictPort', `[boolean] exit if specified port is already in use`)
    .option('--https', `[boolean] use TLS + HTTP/2`)
    .option('--open [path]', `[boolean | string] open browser on startup`)
    .option('--outDir <dir>', `[string] output directory (default: dist)`)
    .action(
      async (
        root: string,
        options: {
          host?: string | boolean
          port?: number
          https?: boolean
          open?: boolean | string
          strictPort?: boolean
          outDir?: string
        } & GlobalCLIOptions,
      ) => {
        filterDuplicateOptions(options)
        try {
          const server = await preview({
            root,
            base: options.base,
            configFile: options.config,
            logLevel: options.logLevel,
            mode: options.mode,
            build: {
              outDir: options.outDir,
            },
            preview: {
              port: options.port,
              strictPort: options.strictPort,
              host: options.host,
              https: options.https,
              open: options.open,
            },
          })
          server.printUrls();
        } catch (e) {
          createLogger(options.logLevel).error(
            colors.red(`error when starting preview server:\n${e.stack}`),
            { error: e },
          )
          process.exit(1);
        } finally {
          stopProfiler((message) => createLogger(options.logLevel).info(message));
        }
      }
    );

  cli
    .command('analyze [root]')
    .option('--host [host]', '[string] specify hostname')
    .option('--port <port>', '[number] specify port')
    .option(
      '--strictPort',
      '[boolean] exit if specified port is already in use'
    )
    .option('--https', '[boolean] use TLS + HTTP/2')
    .option('--open [path]', '[boolean | string] open browser on startup')
    .action(
      async (
        root: string,
        options: {
          host?: string | boolean;
          port?: number;
          https?: boolean;
          open?: boolean | string;
          strictPort?: boolean;
        } & GlobalCLIOptions
      ) => {
        try {
          const userConfig = {
            root: path.resolve(__dirname, '..'),
            preview: {
              host: options.host,
              port: options.port,
              https: options.https,
              open: options.open || '/esbuild',
              strictPort: options.strictPort,
            },
            build: {
              outDir: path.resolve(__dirname, '../analyze'),
            },
          };
          const server: any = await preview(userConfig);
          server.printUrls();
        } catch (error: any) {
          createLogger(options.logLevel).error(
            colors.red(`error when starting preview server:\n${error.stack}`),
            { error: error }
          );
          // @ts-ignore
          process.exit(1);
        }
      }
    );
  cli
    .command('node [root]')
    .option('-f,--file [file]', '[string] specify hostname')
    .action(
      async (
        root: string,
        options: {
          file: string;
        }
      ) => {
        shelljs.exec(`node -r @cof/fast/dist/register/node.js ${options.file}`);
      }
    );

  cli.help();
  cli.version(VERSION);

  cli.parse();
}
