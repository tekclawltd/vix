import fs from 'fs-extra';
import path from 'path';
import colors from 'picocolors';
import { CLI_ALIAS } from '../../types';
import { makeLogger } from '../../utils';

const PLUGIN_NAME = `${CLI_ALIAS}:copy-plugin`;

type CopyConfig = {
  from: string; // path of source file to-be copied
  to: string; // destination path for copied file
};
const logger = makeLogger({
  logLevel: 'info',
  loggerPrefix: `[${CLI_ALIAS}]`,
});

function copyFiles(copyInputs) {
  logger.info(colors.green(`[${PLUGIN_NAME}] Starting ... \n`), {
    timestamp: true,
  });
  copyInputs.forEach(copyInput => {
    const fromPath = path.parse(copyInput.from);
    const toPath = path.parse(copyInput.to);
    const startTime = Date.now();
    if (!fromPath.ext) {
      fs.copySync(
        path.resolve(process.cwd(), copyInput.from),
        path.resolve(process.cwd(), copyInput.to)
      );
    } else {
      if (!toPath.ext) {
        fs.copyFileSync(
          path.resolve(process.cwd(), copyInput.from),
          path.resolve(process.cwd(), copyInput.to, fromPath.base)
        );
      } else {
        fs.copyFileSync(
          path.resolve(process.cwd(), copyInput.from),
          path.resolve(process.cwd(), copyInput.to)
        );
      }
    }
    const endTime = (Date.now() - startTime) / 1000;
    logger.info(
      colors.green(
        `copied "${copyInput.from}" to "${copyInput.to}",  total spent ${endTime}s\n`
      ),
      {
        timestamp: true,
      }
    );
  });
}

export default (copyInputs: CopyConfig[]) => {
  return {
    name: PLUGIN_NAME,
    configureServer() {
      copyFiles(copyInputs);
    },
    closeBundle() {
      copyFiles(copyInputs);
    },
  };
};
