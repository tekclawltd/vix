import microBundler from './extend/microBundler';
import copy from './extend/copy';
import { FastUserConfig } from './plugins/coreServerPlugin/types';
export * from 'vite';
export { createCli } from './cli';
export { default as fastCorePlugins } from './plugins';
export { register } from './register';
export { installSymlink, makeLogger } from './utils';
export function defineConfig(config: FastUserConfig) {
  return config;
}
export const Extension = {
  microBundler,
  copy,
};