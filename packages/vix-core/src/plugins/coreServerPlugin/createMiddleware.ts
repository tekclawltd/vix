/* eslint-disable global-require */
import colors from 'picocolors';
import http from 'http';
import { Connect, ViteDevServer } from 'vite';

import adapter from './adapter';
import { PLUGIN_NAME, ServerPlugin, FastUserConfig } from './types';

export const getPluginConfig = (server: ViteDevServer): FastUserConfig => {
  const plugin = server.config.plugins.find(
    (p) => p.name === PLUGIN_NAME
  ) as ServerPlugin;
  if (!plugin) {
    console.error(`Could not find plugin ${PLUGIN_NAME}`);
    // @ts-ignore
    exit(1);
  }

  return plugin.getUserConfig();
};

export const createMiddleware = (
  server: ViteDevServer
): Connect.HandleFunction => {
  const config = getPluginConfig(server);
  const { logger } = server.config;

  return async function (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: () => void
  ): Promise<void> {
    const { devServer } = config;
    logger.info(colors.green('request starting...'), { timestamp: true });
    const startTime = Date.now();
    const appModule = await server.ssrLoadModule(devServer.entry!);
    let app = appModule.default;
    if (!app) {
      logger.error(`Failed to find a default export from ${devServer.entry}`, {
        timestamp: true,
      });
      // @ts-ignore
      process.exit(1);
    } else {
      // some app may be created with a function returning a promise
      app = await app;

      if (devServer.adapter) {
        devServer.adapter(req, res, next, {
          app,
          logger,
          config,
        });
      } else {
        adapter(req, res, next, { app, logger, config });
      }
    }
    const endTime = (Date.now() - startTime) / 1000;
    logger.info(colors.green(`request ended, spent ${endTime}s\n`), {
      timestamp: true,
    });
  };
};
