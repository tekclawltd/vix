import type { Plugin } from 'vite';
import { createMiddleware } from '../devServerPlugin/createMiddleware';
import { CLI_ALIAS } from '../../types';
import constructEnvironments from './constructEnv';
import { FastUserConfig } from '../browserBuildPlugin/types'

export const PLUGIN_NAME = `${CLI_ALIAS}:devServer-plugin`;

function devServerPlugin(cfg: FastUserConfig = {}): Plugin {
    const { devServer } = cfg;
    const {
        entry: developmentServerEntry,
        envs,
        ...serverOptions
    } = devServer || {};
    return <Plugin>{
        name: PLUGIN_NAME,
        enforce: 'post',
        apply: 'serve',
        config: () => {
            constructEnvironments(cfg, envs);
            return ({
                server: serverOptions
            })
        },
        configureServer: (server) => {
            if ([developmentServerEntry].every(Boolean)) {
                server.middlewares.use(createMiddleware(server, cfg));
                devServer.routes && Object.entries(devServer.routes)
                    .forEach(([routePath, handler]) => {
                        server.middlewares.use(routePath, handler);
                    });
            }
        },
    };
}

export default devServerPlugin;
