import path from 'path';
import fs from 'fs';
export const __static = __dirname;
export const __preload = path.join(__dirname, 'preload');
const mainFile = import.meta.electron.mainFile;

if (fs.existsSync(mainFile)) {
  require(mainFile);
}
