import colors from 'picocolors';
import path from 'path';
import { HandleFunctionContext } from './types';

export default (
  req: any,
  res: any,
  next: any,
  context: HandleFunctionContext
) => {
  const { app, logger, config } = context;
  const { devServer } = config;
  // check if request assets
  if (
    [
      req.url.includes('/@'),
      req.url.includes('/__'),
      req.url === '/',
      req.url.includes('/?'),
      path.parse(req.url).ext,
    ].some(Boolean)
  ) {
    if (
      [
        req.url.includes('/@'),
        req.url.includes('/__'),
        devServer.requireAuth
          ? !devServer.requireAuth(req, context)
          : process.env.NODE_ENV !== 'prodcution',
      ].some(Boolean)
    ) {
      // let vite server to handle assets
      logger.info(colors.yellow('asset: ') + colors.green(req.url), {
        timestamp: true,
      });
      next();
    } else {
      // pass to real server to handle authentication
      logger.info(colors.yellow('auth: ') + colors.green(req.url), {
        timestamp: true,
      });
      app(req, res, next);
    }
  } else {
    // let real server to handle rest
    logger.info(colors.yellow('api: ') + colors.green(req.url), {
      timestamp: true,
    });
    app(req, res, next);
  }
};
