import { vi, describe, expect, test, afterEach } from 'vitest';
import serverBuildPlugin, {PLUGIN_NAME} from './index';
import buildServer from '../../buildServer';

describe('Return As Plugin', () => {
  test('Return Object Structure keys', () => {
    const OBJ_KEYS = ['name', 'enforce', 'apply', 'config', 'closeBundle'];
    const plugin = serverBuildPlugin({});
    for (let key of OBJ_KEYS) {
      expect(plugin.hasOwnProperty(key)).toBeTruthy();
    }
  });

  test('Check name, enforce and apply are string type', () => {
    const OBJ_KEYS = ['name', 'enforce', 'apply'];
    const plugin = serverBuildPlugin({});
    for (let key of OBJ_KEYS) {
      expect(plugin[key]).toBeTypeOf('string');
    }
  });

  test('Check config, and closeBunlde are function type', () => {
    const OBJ_KEYS = ['config', 'closeBundle'];
    const plugin = serverBuildPlugin({});
    for (let key of OBJ_KEYS) {
      expect(plugin[key]).toBeTypeOf('function');
    }
  });
});

describe('serverBuildPlugin Function()', () => {
  test('Check function return value', () => {
    const plugin = serverBuildPlugin({});
    expect(plugin.name).toBe(PLUGIN_NAME);;
    expect(plugin.enforce).toBe('post');;
    expect(plugin.apply).toBe('build');;
  });

  test('Return result should Match Snapshot', () => {
    const plugin = serverBuildPlugin({});
    expect(plugin).toMatchSnapshot();
  });
});

vi.mock('../../buildServer', () => {
  return {
    default: vi.fn()
  };
});

describe('Test serverBuildPlugin().config() and closeBundle()', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockOption = {
    customLogger: 'fakelogger',
    mode: 'fakeMode'
  };

  test('When fastconfig.serverBuild is truthy', async () => {
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

  test('When fastconfig.serverBuild.entry is falsy', async () => {
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

  test('When fastconfig.serverBuild is falsy', async () => {
    const mockConfig = {
      serverBuild: ''
    };
    const plugin1: any = serverBuildPlugin(mockConfig as any);
    plugin1.config(mockOption);
    await plugin1.closeBundle();
    expect(buildServer).not.toHaveBeenCalled();
  });
});