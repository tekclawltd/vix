import { register } from '../../register';
import { FastUserConfig } from '../browserBuildPlugin/types';

// for supporting module exports
global.exports = global.exports || {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
};

export default (config: FastUserConfig, envs?: Record<string, string>) => {
  const { include = [] } = config;
  const mergeInclude: any = [...include, process.cwd()].filter(Boolean);
  register({
    include: mergeInclude,
  });
  return (
    envs &&
    Object.defineProperties(
      process.env,
      Object.fromEntries(
        Object.keys(envs).map(next => [
          next,
          {
            value: envs[next],
            writable: true,
          },
        ])
      )
    )
  );
};
