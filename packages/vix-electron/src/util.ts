import { Paths, Utils } from '@tekclaw/vix-utils';
import { build, BuildOptions } from 'esbuild';
import fs from 'fs';
import { readJSON, writeFile } from 'fs-extra';
import path from 'path';

import { Config } from './index';

const { merge } = Utils;
const buildInDependances = new Set(['deepmerge']);
const external = ['electron'];

const changeExtendsion = (filePath: string, ext: string): string => {
  const pos = filePath.lastIndexOf('.');
  filePath =
    filePath.slice(0, Math.max(0, pos < 0 ? filePath.length : pos)) + ext;
  return filePath;
};

const injectMeta = (config: Config) => {
  const {
    root,
    pluginConfig: { window = {}, preloadFile = '', mainFile = '' },
    build: { outDir },
    env,
  } = config;
  const define: any = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value),
    ])
  );

  define['import.meta.electron.window'] = JSON.stringify(window);

  define['import.meta.electron.preload'] = JSON.stringify(
    preloadFile
      ? path.resolve(root, outDir, changeExtendsion(preloadFile, '.js'))
      : 'false'
  );

  define['import.meta.electron.mainFile'] = JSON.stringify(
    mainFile
      ? path.resolve(root, outDir, changeExtendsion(mainFile, '.js'))
      : 'false'
  );

  return define;
};

type BuildConfig = {
  readonly buildOptions: BuildOptions;
  readonly dependenciesSet: ReadonlySet<any>;
};

const buildConfig = (config: Config): BuildConfig => {
  const define = injectMeta(config);
  const dependenciesSet = new Set();
  const buildOptions: BuildOptions = {
    platform: 'node',
    allowOverwrite: true,
    absWorkingDir: process.cwd(),
    bundle: true,
    format: 'cjs',
    external,
    define,
    sourcemap: config.command === 'serve' ? 'both' : false,
    plugins: [
      {
        name: 'externalize-deps',
        setup(esbuild: any) {
          esbuild.onResolve({ filter: /.*/ }, (args: any) => {
            const id = args.path;

            if (
              [
                id[0] !== '.',
                !path.isAbsolute(id),
                !buildInDependances.has(id),
              ].every(Boolean)
            ) {
              dependenciesSet.add(id);
              return {
                external: true,
              };
            }
          });
        },
      },
    ],
  };
  return {
    buildOptions,
    dependenciesSet,
  };
};

export async function mainProcessBuild(
  config: Config,
  onRebuild?: (error: any) => void
) {
  const mainProcessFile = path.resolve(__dirname, '../main/electron-main.js');
  const inject = [
    path.join(
      __dirname,
      '../main/inject',
      `${config.command === 'serve' ? 'devInject.js' : 'buildInject.js'}`
    ),
  ];
  const { buildOptions, dependenciesSet } = buildConfig(config);
  const mergeBuildOptions = merge(buildOptions, {
    entryPoints: [mainProcessFile],
    outfile: path.join(config.build.outDir, 'electron-main.js'),
    inject,
    watch: config.command === 'serve' ? { onRebuild } : false,
  });
  await build(mergeBuildOptions);
  return {
    dependencies: [...dependenciesSet],
  };
}

function readDir(dir: string, res: readonly string[] = []) {
  const _res = [...res];
  for (const item of fs.readdirSync(dir)) {
    const filePath = path.join(dir, item);
    const stat = fs.lstatSync(filePath);
    if (!stat.isDirectory()) {
      if (['.ts', '.js'].includes(path.extname(filePath))) {
        _res.push(filePath);
      }
    } else {
      _res.concat(readDir(filePath, _res));
    }
  }
  return _res;
}

function readDirs(dirs: readonly string[]) {
  return [
    ...new Set(
      dirs.filter(dir => fs.existsSync(dir)).flatMap(dir => readDir(dir))
    ),
  ];
}

export async function preloadBuild(
  config: Config,
  onRebuild?: (error: any) => void
) {
  const {
    root,
    pluginConfig: { preloadFile = '', mainFile = '' },
    command,
    build: { outDir },
  } = config;

  const inject = [
    path.resolve(
      __dirname,
      '../main/inject',
      `${command === 'serve' ? 'devPreloadInject.js' : 'buildPreloadInject.js'}`
    ),
  ];
  const { APP_CONFIG_FILENAME } = Paths;
  const entryPaths = [preloadFile, mainFile, APP_CONFIG_FILENAME]
    .filter(Boolean)
    .map(dir => path.resolve(root, path.parse(dir).dir));
  const entryPoints = readDirs(entryPaths);
  const { buildOptions, dependenciesSet } = buildConfig(config);
  const mergeBuildOptions = merge(buildOptions, {
    entryPoints,
    bundle: false,
    external: undefined,
    outdir: path.resolve(outDir),
    outbase: path.resolve(process.cwd()),
    watch:
      command === 'serve'
        ? {
            onRebuild,
          }
        : false,
    inject,
  });
  await build(mergeBuildOptions);

  return {
    dependencies: [...dependenciesSet],
  };
}

export const injectDefine = (config: Config) => {
  const {
    root,
    command,
    pluginConfig: { preloadFile = 'preload' },
  } = config;

  const publicDir =
    command === 'serve'
      ? JSON.stringify(path.resolve(root, 'public'))
      : JSON.stringify(path.resolve(__dirname, '../../app.asar'));

  const preload =
    command === 'serve'
      ? JSON.stringify(path.resolve(root, preloadFile))
      : JSON.stringify(path.resolve(__dirname, '../../app.asar', preloadFile));
  const cwd = root;
  return {
    publicDir,
    preload,
    cwd,
  };
};

export function injectGlobalVariable(config: Config) {
  const { publicDir, preload, cwd } = injectDefine(config);
  return `
    <script>
      window.__cwd = '${cwd}';
      window.__static = ${publicDir};
      window.__preload = ${preload};
    </script>
  </head>
  `;
}

export const generatePackageJson = async function (
  config: Config,
  dependencies: any
): Promise<any> {
  const original = await readJSON(path.join(config.root, './package.json'));
  const result = {
    name: original.name,
    author: original.author,
    version: original.version,
    license: original.license,
    description: original.description,
    main: './electron-main.js',
    dependencies: Object.fromEntries(
      Object.entries(original.dependencies)
        .filter(item => dependencies.includes(item[0]))
        .map(entry => [entry[0], entry[1]])
    ),
  };
  await writeFile(
    path.join(config.build.outDir, 'package.json'),
    JSON.stringify(result)
  );
  return result;
};

export const overridePackageJson = async (config: Config) => {
  const original = await readJSON(path.resolve(config.root, './package.json'));

  const overrided = Utils.merge(original, {
    main: './electron-main.js',
  });
  await writeFile(
    path.resolve(config.build.outDir, 'package.json'),
    JSON.stringify(overrided)
  );
};
