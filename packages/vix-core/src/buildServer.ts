import builtinModules from 'builtin-modules';
import deepmerge from 'deepmerge';
import { build, BuildOptions } from 'esbuild';
import resovleAlias from 'esbuild-plugin-path-alias';
import { ifDependenceExist } from './utils';
import {
  ServerBuildOption,
  FastUserConfig,
} from './plugins/coreServerPlugin/types';

const graphqlPlugin = (gql) =>
  gql &&
  require('@luckycatfactory/esbuild-graphql-loader').default({
    filterRegex: /\.(gql|graphql)$/,
  });

export function cleanOptions<Options extends ServerBuildOption>(
  options: Options
): Omit<Options, keyof BuildOptions> {
  delete options.entry;
  delete options.resolve;
  delete options.plugins;
  return options;
}

export default async (options: FastUserConfig) => {
  const { serverBuild, presets = {} } = options;
  const {
    entry,
    outdir,
    resolve = {},
    plugins: customPlugins,
  } = serverBuild || {};
  const { plugins: presetsPlugins = {} } = presets;
  const { graphql = ifDependenceExist('graphql') } = presetsPlugins;
  const { alias } = resolve;
  const entryPoints = Array.isArray(entry) ? entry : [entry];
  const config: any = deepmerge(
    {
      platform: 'node',
      allowOverwrite: true,
      entryPoints,
      outdir,
      minify: true,
      metafile: true,
      absWorkingDir: process.cwd(),
      target: ['node12'],
      external: builtinModules,
      format: 'cjs',
      bundle: true,
      plugins: [alias && resovleAlias(alias), graphqlPlugin(graphql)]
        .concat(customPlugins)
        .filter(Boolean),
    },
    cleanOptions(serverBuild)
  );
  return build(config);
};
