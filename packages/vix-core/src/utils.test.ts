import { vi } from 'vitest';
import shell from 'shelljs';
import { createLogger } from 'vite';
import path from 'path';
import { GlobalCLIOptions, LoggerOption } from './types';
import {
  cleanOptions,
  ifDependenceExist,
  makeLogger,
  installSymlink,
} from './utils';

vi.mock('vite', () => {
  return {
    createLogger: vi.fn(),
  };
});
vi.mock('path', () => {
  return {
    default: {
      resolve: vi.fn(val => `./mockPath/${val}`),
    },
  };
});
let mockNpmVersion = '6.00';
let mockNodeVersion = '14.00';
const CLI_ALIAS = 'fakeCli';
let withError = false;
const mockExec = (cmd: string) => {
  let output = withError
    ? {
        stdout: '',
        stderr: 'fake error',
        code: 'somecode',
      }
    : {
        stdout: '',
        stderr: undefined,
        code: undefined,
      };
  switch (cmd) {
    case 'npm -v':
      output = {
        ...output,
        stdout: mockNpmVersion,
      };
      break;
    case 'node -v':
      output = {
        ...output,
        stdout: mockNodeVersion,
      };
      break;
    default:
      break;
  }
  return output;
};

vi.mock('shelljs', () => {
  return {
    default: {
      exec: vi.fn(cmd => mockExec(cmd)),
      echo: vi.fn(),
      rm: vi.fn(),
    },
  };
});

describe('cleanOptions()', () => {
  test('should clear the options', () => {
    const options: GlobalCLIOptions = {
      '--': [''],
      c: 'test',
      config: 'test',
      base: 'test',
      l: 'silent',
      logLevel: 'silent',
      clearScreen: true,
      d: 'test',
      debug: 'test',
      f: 'test',
      filter: 'test',
      m: 'test',
      mode: 'test',
      force: false,
    };

    expect(cleanOptions(options)).toStrictEqual({});
  });

  test('should resolve ourDir path', () => {
    const options = {
      outDir: 'dist',
    };

    expect(cleanOptions(options as any)).toStrictEqual({
      outDir: path.resolve(options.outDir),
    });
  });

  test('should delete undefined keys', () => {
    const options = {
      outDir: undefined,
      root: undefined,
    };

    expect(cleanOptions(options as any)).toStrictEqual({});
  });
});

describe('ifDependenceExist()', () => {
  test('should return true when package exist', () => {
    const existPkg: string = 'vite';

    expect(ifDependenceExist(existPkg)).toBe(true);
  });

  test('should return false when package does not exist', () => {
    const nonExistPkg: string = 'something';

    expect(ifDependenceExist(nonExistPkg)).toBe(false);
  });
});

describe('makeLogger()', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should call makeLogger with correct arguments', () => {
    const options: LoggerOption = {
      logLevel: 'info',
      loggerPrefix: 'fast',
    };

    makeLogger(options);

    expect(createLogger).toBeCalledWith(options.logLevel, {
      prefix: options.loggerPrefix,
      allowClearScreen: options.clearScreen,
      customLogger: options.customLogger,
    });
  });
});

describe('installSymlink()', () => {
  beforeAll(() => {
    vi.spyOn(Number, 'parseFloat');
    installSymlink(CLI_ALIAS);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should call shelljs in correct order', () => {
    expect(shell.echo).toHaveBeenNthCalledWith(1, '');
    expect(shell.echo).toHaveBeenNthCalledWith(
      2,
      '🕓  The setup process can take few minutes.'
    );
    expect(shell.echo).toHaveBeenNthCalledWith(3, '');
    expect(shell.echo).toHaveBeenNthCalledWith(
      4,
      `📦  Linking ${CLI_ALIAS}-cli...`
    );
    expect(shell.rm).toHaveBeenNthCalledWith(
      1,
      '-f',
      `/usr/local/bin/${CLI_ALIAS}`
    );
    expect(shell.exec).toHaveBeenNthCalledWith(
      3,
      `ln -s "$(pwd)/dist/bin/cli.js" /usr/local/bin/${CLI_ALIAS}`,
      {
        silent: true,
      }
    );
    expect(shell.exec).toHaveBeenNthCalledWith(
      4,
      `chmod +x /usr/local/bin/${CLI_ALIAS}`
    );
    expect(shell.echo).toHaveBeenNthCalledWith(5, '✅  Success');
    expect(shell.echo).toHaveBeenNthCalledWith(
      2,
      '🕓  The setup process can take few minutes.'
    );
    expect(shell.echo).toHaveBeenNthCalledWith(
      7,
      `✅  ${CLI_ALIAS} has been succesfully installed.`
    );
    expect(shell.echo).toHaveBeenNthCalledWith(
      8,
      `✅  Try \`${CLI_ALIAS} --help\``
    );
  });

  describe('when has error during installation', () => {
    beforeAll(() => {
      vi.spyOn(console, 'error').mockImplementation(() => ({} as any));
      vi.spyOn(process, 'exit').mockImplementation(() => ({} as any));
      withError = true;
      installSymlink(CLI_ALIAS);
    });
    afterEach(() => {
      vi.clearAllMocks();
    });

    test('should call console.error() with error message', () => {
      expect(console.error).toBeCalledWith('fake error');
    });
  });

  describe('when npm or node version do not meet minimum requirement', () => {
    test('should call shell.exec() with "npm -v" and raise error', () => {
      mockNpmVersion = '3.0';
      const expectedError = `[ERROR: ${CLI_ALIAS}] You need npm version @>=5`;

      expect(() => installSymlink(CLI_ALIAS)).toThrowError(expectedError);
      expect(shell.exec).toHaveBeenNthCalledWith(1, 'npm -v');
    });

    test('should call shell.exec() with "node -v" and raise error', () => {
      mockNpmVersion = '6.0';
      mockNodeVersion = 'v9.0';
      const expectedError = `[ERROR: ${CLI_ALIAS}] You need to use node version @>=10`;

      expect(() => installSymlink(CLI_ALIAS)).toThrowError(expectedError);
      expect(shell.exec).toHaveBeenNthCalledWith(2, 'node -v');
    });
  });
});
