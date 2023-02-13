import fs from 'fs';
import path from 'path';
import {
  BuildOptions,
  ConfigEnv,
  InlineConfig,
  loadConfigFromFile,
  Plugin,
  resolveConfig,
  ServerOptions,
} from 'vite';

import corePlugins from './plugins';
import { CLI_ALIAS, GlobalCLIOptions } from './types';
import { cleanOptions, makeLogger } from './utils';

const loadUserConfig = async (
  options: BuildOptions & ServerOptions & GlobalCLIOptions,
  command: 'build' | 'serve'
) => {
  const buildOptions: BuildOptions = cleanOptions(options);
  const serverOptions: ServerOptions = cleanOptions(options);

  const configEnv: ConfigEnv = { command, mode: options.mode || 'development' };
  const { config }: any = await loadConfigFromFile(
    configEnv,
    options.config,
    options.root,
    options.logLevel
  );
  const { presets = {}, plugins = [], devServer, browserBuild } = config;

  const { loggerPrefix } = presets;
  const logger = makeLogger({
    logLevel: 'info',
    loggerPrefix: loggerPrefix || `[${CLI_ALIAS}]`,
  });
  const mergeDevServerOptions = {
    ...devServer,
    ...serverOptions,
  }

  if (browserBuild) {
    const { build = {}, outDir = '' } = browserBuild;
    const mergeBuildOptions = {
      outDir,
      ...build,
      ...buildOptions,
    }
    config.devServer = mergeDevServerOptions;
    config.browserBuild.build = mergeBuildOptions;
  }

  const inlineConfig: InlineConfig = Object.assign(
    {
      root: options.root,
      base: options.base,
      mode: options.mode,
      logLevel: options.logLevel,
      clearScreen: options.clearScreen,
      customLogger: logger,
      plugins: [
        ...plugins,
        corePlugins(options, config, command) as Plugin[],
      ]
        .flat(Number.POSITIVE_INFINITY)
        .filter(Boolean),
    },
    command === 'serve' && {
      server: mergeDevServerOptions,
    },
    command === 'build' && {
      build: buildOptions,
    }
  );

  return inlineConfig;
};

export default async (
  options: BuildOptions & ServerOptions & GlobalCLIOptions,
  command: 'build' | 'serve'
) => {
  const isConfigExist = fs.existsSync(path.resolve(options.config!));
  const wrapOptions = {
    root: options.root,
    base: options.base,
    mode: options.mode,
    logLevel: options.logLevel,
    clearScreen: options.clearScreen,
    server: {
      open: options.open || true,
      ...cleanOptions(options),
    },
  };
  const inlineConfig: InlineConfig = isConfigExist
    ? await loadUserConfig(options, command)
    : (
      await resolveConfig(
        {
          ...wrapOptions,
          plugins: [corePlugins(wrapOptions, {}, command) as Plugin[]],
        },
        command
      )
    ).inlineConfig;

  return inlineConfig;
};
