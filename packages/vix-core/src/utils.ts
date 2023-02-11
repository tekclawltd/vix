import shell from 'shelljs';
import { createLogger, Logger } from 'vite';
import path from 'path';
import { GlobalCLIOptions, LoggerOption } from './types';
/**
 * removing global flags before passing as command specific sub-configs
 */
export function cleanOptions<Options extends GlobalCLIOptions>(
  options: Options
): Omit<Options, keyof GlobalCLIOptions> {
  const ret = { ...options };
  delete ret['--'];
  delete ret.c;
  delete ret.config;
  delete ret.base;
  delete ret.l;
  delete ret.logLevel;
  delete ret.clearScreen;
  delete ret.d;
  delete ret.debug;
  delete ret.f;
  delete ret.filter;
  delete ret.m;
  delete ret.mode;
  delete ret.force;

  Object.keys(ret).forEach(key => {
    ret[key] === undefined && delete ret[key];
  });
  ret['outDir'] && (ret['outDir'] = path.resolve(ret['outDir']));
  return ret;
}

export const ifDependenceExist = (name: string) => {
  const pkgPath = `${process.cwd()}/package.json`;
  const pkg = require(pkgPath);
  return ['dependencies', 'devDependencies']
    .filter(dep => Boolean(pkg[dep]))
    .some(dep => Object.keys(pkg[dep]).includes(name));
};

export const makeLogger = (options: LoggerOption): Logger =>
  createLogger(options.logLevel, {
    prefix: options.loggerPrefix,
    allowClearScreen: options.clearScreen,
    customLogger: options.customLogger,
  });

export function installSymlink(cliName: string) {
  // Check npm version
  const npm = shell.exec('npm -v').stdout;

  if (Number.parseFloat(npm) < 5) {
    throw new Error(`[ERROR: ${cliName}] You need npm version @>=5`);
  }

  const nodeVersion = shell.exec('node -v').stdout.replace('v', '');

  if (Number.parseFloat(nodeVersion) < 10.1) {
    throw new Error(`[ERROR: ${cliName}] You need to use node version @>=10`);
  }

  // Store installation start date.
  const silent = process.env.npm_config_debug !== 'true';

  const watcher = (label: string, cmd: string, withSuccess = true) => {
    if (label.length > 0) {
      shell.echo(label);
    }

    const data = shell.exec(cmd, {
      silent,
    });

    if (data.stderr && data.code !== 0) {
      console.error(data.stderr);
      // @ts-ignore
      process.exit(1);
    }

    if (label.length > 0 && withSuccess) {
      shell.exec(`chmod +x /usr/local/bin/${cliName}`);
      shell.echo('✅  Success');
      shell.echo('');
    }
  };

  shell.echo('');
  shell.echo('🕓  The setup process can take few minutes.');
  shell.echo('');

  // Remove existing binary.
  shell.rm('-f', `/usr/local/bin/${cliName}`);
  watcher(
    `📦  Linking ${cliName}-cli...`,
    `ln -s "$(pwd)/dist/bin/cli.js" /usr/local/bin/${cliName}`
  );
  shell.echo(`✅  ${cliName} has been succesfully installed.`);
  shell.echo(`✅  Try \`${cliName} --help\``);
}
