import { Utils } from '@tekclaw/vix-utils';
import { ChildProcess, spawn } from 'child_process';
import electron from 'electron';
import path from 'path';
import { ViteDevServer } from 'vite';

import { Config } from './index';
import { mainProcessBuild, preloadBuild } from './util';

const startTime = Date.now();
let electronProcess: null | ChildProcess = null;
let manualRestart = false;
const { logger } = Utils;
async function buildMain(config: Config) {
  function onRebuild(error: any) {
    if (error) {
      throw error;
    }
    if (electronProcess) {
      logger.info(`electron restarting...`);
      manualRestart = true;
      //@ts-ignore
      process.kill(electronProcess.pid);
      electronProcess = null;

      startElectron(config);
      setTimeout(() => {
        manualRestart = false;
      }, 5000);
    }
  }
  await mainProcessBuild(config, onRebuild);
}

function startElectron(config: Config) {
  const args = [
    '--inspect=5781',
    path.resolve(config.root, config.build.outDir, './electron-main.js'),
    '--remote-debugging-port=9222',
  ];
  //@ts-ignore
  electronProcess = spawn(electron, args);
  electronProcess?.stdout?.on('data', data => {
    logger.info(data.toString());
  });
  electronProcess?.stderr?.on('data', data => {
    logger.info(data.toString());
  });
  electronProcess?.on('close', () => {
    // eslint-disable-next-line unicorn/no-process-exit
    if (!manualRestart) process.exit();
  });
}

const buildPreload = async (config: Config, server: ViteDevServer) => {
  const {
    pluginConfig: { preloadFile = '' },
  } = config;
  const onRebuild = (error: any) => {
    if (error) {
      console.error('watch build failed:', error);
      return;
    }
    server.ws.send({
      type: 'full-reload',
      path: '*',
    });
    logger.info('reloaded ' + preloadFile);
  };
  await preloadBuild(config, onRebuild);
};

export default async function (config: Config, server: ViteDevServer) {
  await Promise.all([buildPreload(config, server), buildMain(config)]);
  await startElectron(config);
  logger.info(`electron started, spent ${(Date.now() - startTime) / 1000}s`);
}
