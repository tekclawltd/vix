import { GlobalCLIOptions } from '../types';
import { ifDependenceExist } from '../utils';
import { FastUserConfig } from './browserBuildPlugin/types';

const convertBoolean = (opts?: any) =>
  typeof opts === 'boolean' ? undefined : opts;
interface PluginOptions {
  moduleName?: string;
  config?: any;
}

const loadPlugin = (
  shouldLoaded: boolean,
  pluginPath: string,
  options?: PluginOptions
) => {
  if (shouldLoaded) {
    const plugin = require(pluginPath);
    const cleanOptions = convertBoolean(options?.config);
    return typeof plugin === 'function'
      ? plugin(cleanOptions)
      : plugin[options?.moduleName || 'default'](cleanOptions);
  }
  return false;
};

export default (
  options: GlobalCLIOptions,
  config: FastUserConfig,
  command: 'build' | 'serve'
) => {
  const { presets = {}, browserBuild, serverBuild, devServer, hooks } = config;
  const { debug } = options;
  const { plugins: presetsPlugins = {} } = presets;
  const {
    yaml = true,
    graphql = ifDependenceExist('graphql'),
    react = true,
    optimizePersist = true,
    commonjs = true,
    mdx = true,
  } = presetsPlugins;
  return [
    loadPlugin([browserBuild].every(Boolean), './browserBuildPlugin', {
      config,
    }),
    loadPlugin([serverBuild].every(Boolean), './serverBuildPlugin', { config }),
    loadPlugin([devServer].every(Boolean), './devServerPlugin', { config }),
    loadPlugin([commonjs].every(Boolean), 'vite-plugin-commonjs', {
      config: commonjs,
    }),
    loadPlugin([browserBuild, react].every(Boolean), './presetReact', {
      config: react,
    }),
    loadPlugin([browserBuild, yaml].every(Boolean), '@rollup/plugin-yaml', {
      config: yaml,
    }),
    loadPlugin(
      [browserBuild, graphql].every(Boolean),
      '@rollup/plugin-graphql',
      { config: graphql }
    ),
    loadPlugin(
      [browserBuild, optimizePersist].every(Boolean),
      './optimizePersistPlugin',
      { config: optimizePersist }
    ),
    loadPlugin([hooks].every(Boolean), './eventHooksPlugin', { config }),
    loadPlugin(
      [command === 'serve', browserBuild, debug].every(Boolean),
      'vite-plugin-inspect',
      { config: debug }
    ),
    loadPlugin([mdx].every(Boolean), '@mdx-js/rollup', { config: mdx }),
    // loadPlugin([mdx].every(Boolean), '@rollup/plugin-babel', {
    //   moduleName: ' babel',
    //   config: {
    //     extensions: ['.js', '.jsx', '.cjs', '.mjs', '.md', '.mdx'],
    //   },
    // }),
  ].filter(Boolean);
};
