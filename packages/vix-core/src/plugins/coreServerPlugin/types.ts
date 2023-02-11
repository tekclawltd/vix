import { BuildOptions } from 'esbuild';
import { IncomingMessage, ServerResponse } from 'http';
import {
  Plugin,
  PluginOption,
  ServerOptions,
  UserConfig as ViteUserConfig,
  Logger,
} from 'vite';

import { CLI_ALIAS } from '../../types';
import { Options as OptimizePersistOptions } from '../optimizePersistPlugin';
import { RollupYamlOptions } from '@rollup/plugin-yaml';
import { RollupGraphqlOptions } from '@rollup/plugin-graphql';
import { ReactPresetPluginOptions } from '../presetReact';

export const PLUGIN_NAME = `${CLI_ALIAS}:core-server-plugin`;

type OmitedViteUserConfig = Omit<ViteUserConfig, 'server | plugins'>;

export type NextFunction = (err?: any) => void;

export type SimpleHandleFunction = (
  req: IncomingMessage,
  res: ServerResponse
) => void;
export type NextHandleFunction = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction
) => void;

export interface HandleFunctionContext {
  app: any;
  logger: Logger;
  config: FastUserConfig;
}

export type ContextNextHandleFunction = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
  context: HandleFunctionContext
) => void;

export type ContextrequireAuthFunction = (
  req: IncomingMessage,
  context: HandleFunctionContext
) => boolean;

export type HandleFunction =
  | SimpleHandleFunction
  | NextHandleFunction
  | ContextNextHandleFunction;
export interface BrowserBuildOption
  extends OmitedViteUserConfig {
  outDir: string;
}
export interface DevServerOption extends ServerOptions {
  entry?: string;
  envs?: Record<string, string>;
  adapter?: HandleFunction;
  requireAuth?: ContextrequireAuthFunction;
  routes?: { [routePath: string]: NextHandleFunction }
}

export interface ServerBuildOption extends BuildOptions {
  entry?: string | string[];
  resolve?: Record<string, any>;
}

export type OptimizePersistPluginOptions =
  | OptimizePersistOptions
  | boolean
  | undefined;

export interface PresetsPluginOptions {
  optimizePersist?: OptimizePersistPluginOptions;
  yaml?: RollupYamlOptions | boolean;
  graphql?: RollupGraphqlOptions | boolean;
  react?: ReactPresetPluginOptions | boolean;
}

export interface PresetsOption {
  plugins?: PresetsPluginOptions;
  loggerPrefix?: string;
  forceLoadJsAsJsx?: boolean;
}

export type IncludeType = string[] | RegExp[];

export interface HooksOption {
  onBefore?: (config: FastUserConfig) => void;
  onEnd?: (config: FastUserConfig) => void;
}
export interface FastUserConfig {
  browserBuild?: BrowserBuildOption;
  devServer?: DevServerOption;
  serverBuild?: ServerBuildOption;
  hooks?: HooksOption;
  plugins?: (PluginOption | PluginOption[])[];
  include?: IncludeType;
  presets?: PresetsOption;
}

export interface ServerPlugin extends Plugin {
  getUserConfig(): FastUserConfig;
}

export { CLI_ALIAS } from '../../types';
