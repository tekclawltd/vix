import { CLI_ALIAS } from './types';
import { installSymlink } from './utils';
import path from 'path';

const binPath = path.resolve(__dirname, '../esm/bin/cli.js');

installSymlink(CLI_ALIAS, binPath);
