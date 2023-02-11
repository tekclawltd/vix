import { vi } from 'vitest';
import { CLI_ALIAS } from './types';
import { installSymlink } from './utils';

vi.mock('./utils', () => {
    return {
        installSymlink: vi.fn(),
    };
});

describe('installSymlink', () => {
    test('should call installSymlink(CLI_ALIAS)', async() => {
        await vi.importActual('./install');
        expect(installSymlink).toBeCalledWith(CLI_ALIAS);
    });
});