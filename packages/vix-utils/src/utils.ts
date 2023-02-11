import deepMerge from 'deepmerge';
import { createLogger, InlineConfig } from 'vite';

export const merge = (...args: readonly any[]): any =>
  deepMerge.all(Array.from(args));

export type ExtendedConfig = InlineConfig & {
  readonly loggerPrefix: string;
};

export const makeLogger = (options: ExtendedConfig) =>
  createLogger(options.logLevel, {
    prefix: options.loggerPrefix,
    allowClearScreen: options.clearScreen,
    customLogger: options.customLogger,
  });

export const logger = makeLogger({
  logLevel: 'info',
  loggerPrefix: '[vix]',
});
