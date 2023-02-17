import type { Logger, Plugin } from 'vite';
import buildServer from '../../buildServer';
import { CLI_ALIAS } from '../../types';
import { FastUserConfig } from '../browserBuildPlugin/types'

export const PLUGIN_NAME = `${CLI_ALIAS}:server-build-plugin`;

function serverBuildPlugin(cfg: FastUserConfig = {}): Plugin {
    const fastConfig: FastUserConfig = cfg;
    let logger: Logger;
    let mode: string;
    return <Plugin>{
        name: PLUGIN_NAME,
        enforce: 'post',
        apply: 'build',
        config: (config) => {
            const { customLogger, mode: optionMode } = config;
            logger = customLogger;
            mode = optionMode;
        },
        closeBundle: async () => {
            const { serverBuild } = fastConfig;
            if ([serverBuild, serverBuild?.entry].every(Boolean)) {
                await buildServer(fastConfig, logger, mode);
            }
        }
    };
}

export default serverBuildPlugin;
