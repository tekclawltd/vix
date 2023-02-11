import path from 'path';
import fs from 'fs';
export const __static = path.join(process.cwd(), 'public');
export const __preload = path.join(process.cwd(), 'dist/preload');
const mainFile = import.meta.electron.mainFile;
if (fs.existsSync(mainFile)) {
  require(mainFile);
}
