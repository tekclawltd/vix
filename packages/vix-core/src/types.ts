import { LogLevel, UserConfig as ViteUserConfig } from 'vite';

export const CLI_ALIAS = 'fast';
// global options
export declare interface GlobalCLIOptions {
  '--'?: string[];
  c?: boolean | string;
  config?: string;
  r?: string;
  electron?: boolean;
  root?: string;
  base?: string;
  l?: LogLevel;
  logLevel?: LogLevel;
  clearScreen?: boolean;
  d?: boolean | string;
  debug?: boolean | string;
  f?: string;
  filter?: string;
  m?: string;
  mode?: string;
  force?: boolean;
}

export interface LoggerOption extends ViteUserConfig {
  loggerPrefix: string;
}
