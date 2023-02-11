import { TransformOptions, transformSync } from 'esbuild';
import fs from 'fs';
import { Module } from 'module';
import { dirname, extname } from 'path';
import { addHook } from 'pirates';
import type { RawSourceMap } from 'source-map';
import sourceMapSupport, { UrlAndMap } from 'source-map-support';
import { removeNodePrefix } from './utils';
import { getOptions, inferPackageFormat } from './options';

let compiling = false;
// @ts-ignore
const internalModuleCache = Module._cache;
let piratesRevert: any = null;

const map: { [file: string]: string | RawSourceMap } = {};

function installSourceMapSupport() {
  sourceMapSupport.install({
    handleUncaughtExceptions: false,
    environment: 'node',
    retrieveSourceMap(file: string) {
      if (map[file]) {
        return {
          url: file,
          map: map[file],
        } as UrlAndMap;
      }
      return null;
    },
  });
}

type COMPILE = (
  code: string,
  filename: string,
  format?: 'cjs' | 'esm'
) => string;

/**
 * Patch the Node CJS loader to suppress the ESM error
 * https://github.com/nodejs/node/blob/069b5df/lib/internal/modules/cjs/loader.js#L1125
 *
 * As per https://github.com/standard-things/esm/issues/868#issuecomment-594480715
 */
function patchCommonJsLoader(compile: COMPILE) {
  // @ts-expect-error
  const extensions = Module._extensions;
  const jsHandler = extensions['.js'];

  extensions['.js'] = function (module: any, filename: string) {
    try {
      return jsHandler.call(this, module, filename);
    } catch (error: any) {
      if (error.code !== 'ERR_REQUIRE_ESM') {
        throw error;
      }

      let content = fs.readFileSync(filename, 'utf8');
      content = compile(content, filename, 'cjs');
      module._compile(content, filename);
    }
  };
}

type LOADERS = 'js' | 'jsx' | 'ts' | 'tsx';
const FILE_LOADERS = {
  '.js': 'js',
  '.jsx': 'jsx',
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.mjs': 'js',
} as const;

type EXTENSIONS = keyof typeof FILE_LOADERS;

const DEFAULT_EXTENSIONS = Object.keys(FILE_LOADERS);

const getLoader = (filename: string): LOADERS =>
  FILE_LOADERS[extname(filename) as EXTENSIONS];

export function register(
  esbuildOptions: TransformOptions & {
    extensions?: EXTENSIONS[];
    include?: string[] | RegExp[];
  } = {}
) {
  const {
    extensions = DEFAULT_EXTENSIONS,
    include,
    ...overrides
  } = esbuildOptions;

  const compile: COMPILE = function compile(code, filename, format?) {
    const dir = dirname(filename);
    const options = getOptions(dir);
    const formater = format ?? inferPackageFormat(dir, filename);
    const {
      code: js,
      warnings,
      map: jsSourceMap,
    } = transformSync(code, {
      sourcefile: filename,
      sourcemap: 'both',
      loader: getLoader(filename),
      target: options.target,
      jsxFactory: options.jsxFactory || 'React.createElement',
      jsxFragment: options.jsxFragment || 'React.Fragment',
      format: formater,
      ...overrides,
    });
    map[filename] = jsSourceMap;
    if (warnings && warnings.length > 0) {
      for (const warning of warnings) {
        console.log(warning.location);
        console.log(warning.text);
      }
    }
    if (format === 'esm') return js;
    return removeNodePrefix(js);
  };

  function compileHook(code: any, filename: any) {
    if (compiling) return code;
    // @ts-ignore
    const globalModuleCache = Module._cache;
    try {
      compiling = true;
      // @ts-ignore
      Module._cache = internalModuleCache;
      if (include?.map(r => new RegExp(r)).some(r => r.test(filename))) {
        return compile(code, filename);
      }
      return code;
    } finally {
      compiling = false;
      // @ts-ignore
      Module._cache = globalModuleCache;
    }
  }

  function hookExtensions(exts: any) {
    if (piratesRevert) piratesRevert();
    piratesRevert = addHook(compileHook, { exts, ignoreNodeModules: false });
  }

  installSourceMapSupport();
  patchCommonJsLoader(compile);
  hookExtensions(extensions);
}

export function revert() {
  if (piratesRevert) piratesRevert();
}
