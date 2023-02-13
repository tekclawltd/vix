import builtinModules from 'builtin-modules';
import colors from 'picocolors';
import { analyzeMetafile } from 'esbuild';
import path from 'path';
import fse from 'fs-extra';
import deepmerge from 'deepmerge';
import { build, BuildOptions } from 'esbuild';
import resovleAlias from 'esbuild-plugin-path-alias';
import { ifDependenceExist } from './utils';
import {
  ServerBuildOption,
  FastUserConfig,
} from './plugins/browserBuildPlugin/types';
import { Logger } from 'vite';

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

const buildBundle = async (options: FastUserConfig) => {
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


export default async (config: FastUserConfig, logger: Logger) => {
  let report;
  const { serverBuild } = config;
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

  const result = await buildBundle({
    ...config,
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
    logger.info(colors.bold('Server Build:'));
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
    logger.info('');
  };
  result?.metafile && printReport(result.metafile);
}