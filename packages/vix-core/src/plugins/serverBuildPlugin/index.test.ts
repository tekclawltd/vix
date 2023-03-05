import { vi, describe, expect, test, beforeEach, afterEach } from 'vitest';
import serverBuildPlugin, {PLUGIN_NAME} from './index';
import buildServer from '../../buildServer';
import type { Plugin } from 'vite';

describe('Return As Plugin', () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = serverBuildPlugin({});
  });

  test('Should return Object Structure keys', () => {
    ['name', 'enforce', 'apply', 'config', 'closeBundle'].forEach(key => expect(plugin.hasOwnProperty(key)).toBeTruthy());
  });

  test('Should check name, enforce and apply are string type', () => {
    ['name', 'enforce', 'apply'].forEach(key => expect(plugin[key]).toBeTypeOf('string'));
  });

  test('Should check config, and closeBunlde are function type', () => {
    ['config', 'closeBundle'].forEach(key => expect(plugin[key]).toBeTypeOf('function'));
  });
});

describe('serverBuildPlugin Function()', () => {
  test('Should return an object with expected value', () => {
    const plugin = serverBuildPlugin({});
    expect(plugin.name).toBe(PLUGIN_NAME);;
    expect(plugin.enforce).toBe('post');;
    expect(plugin.apply).toBe('build');;
  });

  test('Should return an object matches snapshot', () => {
    const plugin = serverBuildPlugin({});
    expect(plugin).toMatchSnapshot();
  });
});

vi.mock('../../buildServer', () => {
  return {
    default: vi.fn()
  };
});

describe('Test serverBuildPlugin().config() and serverBuildPlugin().closeBundle()', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockOption = {
    customLogger: 'fakelogger',
    mode: 'fakeMode'
  };

  describe('Test fastconfig.serverBuild value', () => {
    test('When its entry property has truthy value, should call buildServer()', async () => {
      const mockConfig = {
        serverBuild: {
          entry: 'mockEntry'
        }
      };
      const plugin1: any = serverBuildPlugin(mockConfig);
      plugin1.config(mockOption);
      await plugin1.closeBundle();
      expect(buildServer).toBeCalledWith(mockConfig, mockOption.customLogger, mockOption.mode) 
    });

    test('When its entry property has falsy value, should not call buildServer()', async () => {
      const mockConfig = {
        serverBuild: {
          entry: ''
        }
      };
      const plugin1: any = serverBuildPlugin(mockConfig);
      plugin1.config(mockOption);
      await plugin1.closeBundle();
      expect(buildServer).not.toHaveBeenCalled();
    });

    test('When it doesn\'t have entry property, should not call buildServer()', async () => {
      const mockConfig = {
        serverBuild: ''
      };
      const plugin1: any = serverBuildPlugin(mockConfig as any);
      plugin1.config(mockOption);
      await plugin1.closeBundle();
      expect(buildServer).not.toHaveBeenCalled();
    });
  });
});