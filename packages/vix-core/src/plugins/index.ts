import { GlobalCLIOptions } from '../types';
import { ifDependenceExist } from '../utils';
import serverPlugin from './coreServerPlugin';
import { FastUserConfig } from './coreServerPlugin/types';

const convertBoolean = opts => (typeof opts === 'boolean' ? undefined : opts);

const loadPlugin = (opts: any, pluginPath: string) => {
  if (opts) {
    const plugin = require(pluginPath);
    const cleanOptions = convertBoolean(opts);
    return typeof plugin === 'function'
      ? plugin(cleanOptions)
      : plugin.default(cleanOptions);
  }
  return false;
};

export default (
  options: GlobalCLIOptions,
  config: FastUserConfig,
  command: 'build' | 'serve'
) => {
  const { presets = {} } = config;
  const { debug } = options;
  const { plugins: presetsPlugins = {} } = presets;
  const {
    yaml = true,
    graphql = ifDependenceExist('graphql'),
    react = true,
    optimizePersist = true,
  } = presetsPlugins;
  return [
    serverPlugin(config),
    loadPlugin(react, './presetReact'),
    loadPlugin(yaml, '@rollup/plugin-yaml'),
    loadPlugin(graphql, '@rollup/plugin-graphql'),
    loadPlugin(optimizePersist, './optimizePersistPlugin'),
    command === 'serve' && loadPlugin(debug, 'vite-plugin-inspect'),
  ].filter(Boolean);
};
