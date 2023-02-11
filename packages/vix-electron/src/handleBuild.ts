import { Utils } from '@tekclaw/vix-utils';
import { build as electronBuilder } from 'electron-builder';

import { Config } from './index';
import { mainProcessBuild, preloadBuild } from './util';

const { logger } = Utils;

export default async (config: Config) => {
  try {
    const startTime = Date.now();
    logger.info(`building electron...`);
    await preloadBuild(config);
    await mainProcessBuild(config);
    const { builderOptions } = config.pluginConfig;
    await electronBuilder({
      config: builderOptions,
    });
    logger.info(
      `electron build complete, spent ${(Date.now() - startTime) / 1000}s`
    );
  } catch (error) {
    console.error(error);
  }
};
