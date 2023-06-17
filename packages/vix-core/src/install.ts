import { CLI_ALIAS } from './types';
import { installSymlink } from './utils';
import path from 'path';

const binPath = path.resolve(__dirname, '../dist/bin/cli.js');

installSymlink(CLI_ALIAS, binPath);
