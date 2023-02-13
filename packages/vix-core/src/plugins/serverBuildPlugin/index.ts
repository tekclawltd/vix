import type { Logger, Plugin } from 'vite';
import buildServer from '../../buildServer';
import { CLI_ALIAS } from '../../types';
import { FastUserConfig } from '../browserBuildPlugin/types';

export const PLUGIN_NAME = `${CLI_ALIAS}:server-build-plugin`;

function serverBuildPlugin(cfg: FastUserConfig = {}): Plugin {
  const config: FastUserConfig = cfg;
  let logger: Logger;
  return <Plugin>{
    name: PLUGIN_NAME,
    enforce: 'post',
    apply: 'build',
    config: config => {
      const { customLogger } = config;

      logger = customLogger;
    },
    closeBundle: async () => {
      const { serverBuild } = config;
      if ([serverBuild, serverBuild?.entry].every(Boolean)) {
        await buildServer(config, logger);
      }
    },
  };
}

export default serverBuildPlugin;
