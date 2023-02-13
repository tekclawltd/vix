import type { Plugin } from 'vite';
import { CLI_ALIAS } from '../../types';
import { FastUserConfig } from '../browserBuildPlugin/types';
import { makeLogger } from '../../utils';

export const PLUGIN_NAME = `${CLI_ALIAS}:eventHooks-plugin`;

function eventHooksPlugin(cfg: FastUserConfig = {}): Plugin {
  const config: FastUserConfig = cfg;
  const { hooks = {}, presets = {} } = config;
  const { onBefore, onEnd } = hooks;
  onBefore && onBefore(config);

  const { loggerPrefix } = presets;
  const logger = makeLogger({
    logLevel: 'info',
    loggerPrefix: loggerPrefix || `[${CLI_ALIAS}]`,
  });
  return {
    name: PLUGIN_NAME,
    enforce: 'post',
    config: () => {
      return {
        customLogger: logger,
      };
    },
    closeBundle: async () => {
      onEnd && (await onEnd(config));
    },
  };
}

export default eventHooksPlugin;
