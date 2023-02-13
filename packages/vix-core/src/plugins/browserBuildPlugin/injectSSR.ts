import path from 'path';

// @ts-ignore
const pathDir = import.meta.url.replace('file://', '');
const pathObj = path.parse(pathDir);

// eslint-disable-next-line no-underscore-dangle
global.__dirname = pathDir;

// eslint-disable-next-line no-underscore-dangle
global.__filename = pathObj.name + pathObj.ext;
