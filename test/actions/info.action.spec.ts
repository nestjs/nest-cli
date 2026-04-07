import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InfoAction } from '../../actions/info.action.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(() => '{"version": "1.2.3"}'),
}));

vi.mock('../../lib/package-managers/index.js', () => ({
  PackageManagerFactory: {
    find: vi.fn(() => ({
      name: 'MockedPackageManager',
      version: vi.fn(() => '1.0.0'),
    })),
  },
}));

describe('InfoAction', () => {
  let infoAction: InfoAction;

  beforeEach(() => {
    infoAction = new InfoAction();
  });

  describe('displaySystemInformation', () => {
    it('should include a space between the OS name and release version', async () => {
      const consoleSpy = jest
        .spyOn(console, 'info')
        .mockImplementation(() => {});

      await infoAction.handle();

      const osVersionCall = consoleSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('OS Version'),
      );
      expect(osVersionCall).toBeDefined();
      // The second argument (blue-colored string) should have a space
      // between the OS name and the kernel release
      const osVersionValue: string = osVersionCall![1];
      expect(osVersionValue).toMatch(/\w\s+\d/);

      consoleSpy.mockRestore();
    });
  });

  describe('buildNestVersionsWarningMessage', () => {
    it('should return an empty object for one or zero minor versions', () => {
      const dependencies = [
        { packageName: '@nestjs/core', name: 'core', value: '1.2.3' },
        { packageName: '@nestjs/common', name: 'common', value: '1.2.4' },
      ];
      const result = (infoAction as any).buildNestVersionsWarningMessage(
        dependencies,
      );
      expect(result).toEqual({});
    });

    it('should return an object only with whitelisted dependencies', () => {
      const dependencies = [
        { packageName: '@nestjs/core', name: 'core', value: '1.2.3' },
        { packageName: '@nestjs/common', name: 'common', value: '1.2.4' },
        {
          packageName: '@nestjs/schematics',
          name: 'schematics',
          value: '1.2.4',
        },
        {
          packageName: '@nestjs/platform-express',
          name: 'platform-express',
          value: '1.2.4',
        },
        {
          packageName: '@nestjs/platform-fastify',
          name: 'platform-fastify',
          value: '1.2.4',
        },
        {
          packageName: '@nestjs/platform-socket.io',
          name: 'platform-socket.io',
          value: '1.2.4',
        },
        {
          packageName: '@nestjs/platform-ws',
          name: 'platform-ws',
          value: '2.1.0',
        },
        {
          packageName: '@nestjs/websockets',
          name: 'websockets',
          value: '2.1.0',
        },
        { packageName: '@nestjs/test1', name: 'test1', value: '1.2.4' },
        { packageName: '@nestjs/test2', name: 'test2', value: '1.2.4' },
      ];
      const result = (infoAction as any).buildNestVersionsWarningMessage(
        dependencies,
      );
      const expected = {
        '1': [
          { packageName: '@nestjs/core', name: 'core', value: '1.2.3' },
          { packageName: '@nestjs/common', name: 'common', value: '1.2.4' },
          {
            packageName: '@nestjs/schematics',
            name: 'schematics',
            value: '1.2.4',
          },
          {
            packageName: '@nestjs/platform-express',
            name: 'platform-express',
            value: '1.2.4',
          },
          {
            packageName: '@nestjs/platform-fastify',
            name: 'platform-fastify',
            value: '1.2.4',
          },
          {
            packageName: '@nestjs/platform-socket.io',
            name: 'platform-socket.io',
            value: '1.2.4',
          },
        ],
        '2': [
          {
            packageName: '@nestjs/platform-ws',
            name: 'platform-ws',
            value: '2.1.0',
          },
          {
            packageName: '@nestjs/websockets',
            name: 'websockets',
            value: '2.1.0',
          },
        ],
      };
      expect(result).toEqual(expected);
    });

    it('should group dependencies by minor versions and sort them in descending order', () => {
      const dependencies = [
        {
          name: 'schematics',
          packageName: '@nestjs/schematics',
          value: '1.2.3',
        },
        {
          name: 'platform-express',
          packageName: '@nestjs/platform-express',
          value: '1.2.4',
        },
        {
          name: 'platform-fastify',
          packageName: '@nestjs/platform-fastify',
          value: '2.1.0',
        },
        {
          packageName: '@nestjs/platform-socket.io',
          name: 'platform-socket.io',
          value: '1.2$$.4',
        },
        {
          packageName: '@nestjs/websockets',
          name: 'websockets',
          value: '^2.*&1.0',
        },
        {
          name: 'platform-socket.io',
          packageName: '@nestjs/platform-socket.io',
          value: '2.0.1',
        },
      ];

      const result = (infoAction as any).buildNestVersionsWarningMessage(
        dependencies,
      );
      const expected = {
        '2': [
          {
            name: 'platform-fastify',
            packageName: '@nestjs/platform-fastify',
            value: '2.1.0',
          },
          {
            packageName: '@nestjs/websockets',
            name: 'websockets',
            value: '^2.*&1.0',
          },
          {
            name: 'platform-socket.io',
            packageName: '@nestjs/platform-socket.io',
            value: '2.0.1',
          },
        ],
        '1': [
          {
            name: 'schematics',
            packageName: '@nestjs/schematics',
            value: '1.2.3',
          },
          {
            name: 'platform-express',
            packageName: '@nestjs/platform-express',
            value: '1.2.4',
          },
          {
            packageName: '@nestjs/platform-socket.io',
            name: 'platform-socket.io',
            value: '1.2$$.4',
          },
        ],
      };

      expect(result).toEqual(expected);
    });
  });
});
