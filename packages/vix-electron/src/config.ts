import { Paths, Utils } from '@tekclaw/vix-utils';
import fs from 'fs';
import path from 'path';

import { PluginConfig } from './index';

const { resolvePackages, resolveCWD } = Paths;
const { merge } = Utils;

const publicPath = fs.existsSync(resolveCWD('public'))
  ? resolveCWD('public')
  : resolvePackages('vix-electron', 'public');

const appPkgPath = resolveCWD('./package.json');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json');

let appPackageJson;
if (fs.existsSync(appPkgPath)) {
  appPackageJson = require(appPkgPath);
} else {
  throw new Error('Could not find package.json');
}
const appName = appPackageJson.name;
const electronVersion = pkg.devDependencies['electron'];

const defaultOptions: PluginConfig = {
  mainFile: '',
  preloadFile: '',
  platforms: ['MAC'],
  builderOptions: {
    appId: 'innovation.app.dashpadx',
    copyright: 'DashpadX Framework',
    productName: appName,
    electronVersion: electronVersion.replace('^', ''),
    directories: {
      output: 'bin',
      buildResources: publicPath,
    },
    extraMetadata: {
      main: './electron-main.js',
    },
    files: [{ from: 'dist' }, './package.json'],
    extends: null,
    asar: true,
    win: {
      target: [
        {
          target: 'nsis',
          arch: ['x64'],
        },
      ],
      icon: path.join(publicPath, 'assets/logo.png'),
      artifactName: '${productName} Setup ${version}.${ext}',
    },
    nsis: {
      oneClick: false,
      language: '2052',
      perMachine: true,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: 'always',
    },
    mac: {
      target: 'dmg',
      icon: path.join(publicPath, 'assets/logo.png'),
      artifactName: '${productName} Setup ${version}.${ext}',
    },
    dmg: {
      contents: [
        {
          x: 110,
          y: 150,
        },
        {
          x: 400,
          y: 150,
          type: 'link',
          path: '/Applications',
        },
      ],
      artifactName: '${productName} Setup ${version}.${ext}',
    },
  },
};

export function resolvePuglinConfig(
  pluginConfig: PluginConfig = {},
  overrideConfig: PluginConfig = {}
): PluginConfig {
  return merge(defaultOptions, pluginConfig, overrideConfig);
}
