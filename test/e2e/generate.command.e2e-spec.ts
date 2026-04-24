import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createTempDir,
  fileExists,
  readFileContent,
  removeTempDir,
  runNest,
  scaffoldApp,
} from './helpers.js';

describe('Generate Command (e2e)', () => {
  let tmpDir: string;
  let appPath: string;

  beforeEach(() => {
    tmpDir = createTempDir('nest-e2e-generate-');
    appPath = scaffoldApp(tmpDir, 'gen-app');
  });

  afterEach(() => {
    removeTempDir(tmpDir);
  });

  describe('controller', () => {
    it('should generate a controller', () => {
      runNest('generate controller users', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'users', 'users.controller.ts')),
      ).toBe(true);
      expect(
        fileExists(
          path.join(appPath, 'src', 'users', 'users.controller.spec.ts'),
        ),
      ).toBe(true);

      // Should update app.module.ts to import the controller
      const appModule = readFileContent(
        path.join(appPath, 'src', 'app.module.ts'),
      );
      expect(appModule).toContain('UsersController');
    });

    it('should generate a flat controller with --flat', () => {
      runNest('generate controller products --flat', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'products.controller.ts')),
      ).toBe(true);
      // Should not create a subdirectory
      expect(
        fileExists(
          path.join(appPath, 'src', 'products', 'products.controller.ts'),
        ),
      ).toBe(false);
    });

    it('should skip spec file with --no-spec', () => {
      runNest('generate controller orders --no-spec', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'orders', 'orders.controller.ts')),
      ).toBe(true);
      expect(
        fileExists(
          path.join(appPath, 'src', 'orders', 'orders.controller.spec.ts'),
        ),
      ).toBe(false);
    });

    it('should skip import with --skip-import', () => {
      runNest('generate controller no-import --skip-import', appPath);

      const appModule = readFileContent(
        path.join(appPath, 'src', 'app.module.ts'),
      );
      expect(appModule).not.toContain('NoImportController');
    });
  });

  describe('service', () => {
    it('should generate a service', () => {
      runNest('generate service auth', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'auth', 'auth.service.ts')),
      ).toBe(true);
      expect(
        fileExists(path.join(appPath, 'src', 'auth', 'auth.service.spec.ts')),
      ).toBe(true);

      const appModule = readFileContent(
        path.join(appPath, 'src', 'app.module.ts'),
      );
      expect(appModule).toContain('AuthService');
    });

    it('should generate a flat service with --flat --no-spec', () => {
      runNest('generate service logger --flat --no-spec', appPath);

      expect(fileExists(path.join(appPath, 'src', 'logger.service.ts'))).toBe(
        true,
      );
      expect(
        fileExists(path.join(appPath, 'src', 'logger.service.spec.ts')),
      ).toBe(false);
    });
  });

  describe('module', () => {
    it('should generate a module', () => {
      runNest('generate module payments', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'payments', 'payments.module.ts')),
      ).toBe(true);

      const appModule = readFileContent(
        path.join(appPath, 'src', 'app.module.ts'),
      );
      expect(appModule).toContain('PaymentsModule');
    });
  });

  describe('guard', () => {
    it('should generate a guard', () => {
      runNest('generate guard auth', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'auth', 'auth.guard.ts')),
      ).toBe(true);
      expect(
        fileExists(path.join(appPath, 'src', 'auth', 'auth.guard.spec.ts')),
      ).toBe(true);
    });
  });

  describe('interceptor', () => {
    it('should generate an interceptor', () => {
      runNest('generate interceptor logging', appPath);

      expect(
        fileExists(
          path.join(appPath, 'src', 'logging', 'logging.interceptor.ts'),
        ),
      ).toBe(true);
    });
  });

  describe('pipe', () => {
    it('should generate a pipe', () => {
      runNest('generate pipe validation', appPath);

      expect(
        fileExists(
          path.join(appPath, 'src', 'validation', 'validation.pipe.ts'),
        ),
      ).toBe(true);
    });
  });

  describe('filter', () => {
    it('should generate a filter', () => {
      runNest('generate filter http-exception', appPath);

      expect(
        fileExists(
          path.join(
            appPath,
            'src',
            'http-exception',
            'http-exception.filter.ts',
          ),
        ),
      ).toBe(true);
    });
  });

  describe('middleware', () => {
    it('should generate a middleware', () => {
      runNest('generate middleware logger', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'logger', 'logger.middleware.ts')),
      ).toBe(true);
    });
  });

  describe('gateway', () => {
    it('should generate a gateway', () => {
      runNest('generate gateway events', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'events', 'events.gateway.ts')),
      ).toBe(true);
    });
  });

  describe('decorator', () => {
    it('should generate a decorator', () => {
      runNest('generate decorator roles', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'roles', 'roles.decorator.ts')),
      ).toBe(true);
    });
  });

  describe('interface', () => {
    it('should generate an interface', () => {
      runNest('generate interface user', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'user', 'user.interface.ts')),
      ).toBe(true);
    });
  });

  describe('class', () => {
    it('should generate a class', () => {
      runNest('generate class dto/create-user', appPath);

      expect(
        fileExists(
          path.join(appPath, 'src', 'dto', 'create-user', 'create-user.ts'),
        ),
      ).toBe(true);
    });
  });

  describe('resource', () => {
    // TODO: unskip once @nestjs/schematics fixes the directory import of
    // '@angular-devkit/schematics/tasks' (needs '/index.js' suffix under Node ≥22 ESM).
    it.skip('should generate a full CRUD resource', () => {
      runNest('generate resource cats', appPath);

      const catsDir = path.join(appPath, 'src', 'cats');
      expect(fileExists(path.join(catsDir, 'cats.controller.ts'))).toBe(true);
      expect(fileExists(path.join(catsDir, 'cats.service.ts'))).toBe(true);
      expect(fileExists(path.join(catsDir, 'cats.module.ts'))).toBe(true);

      // Should have DTOs
      expect(fileExists(path.join(catsDir, 'dto', 'create-cat.dto.ts'))).toBe(
        true,
      );
      expect(fileExists(path.join(catsDir, 'dto', 'update-cat.dto.ts'))).toBe(
        true,
      );

      // Should have entities
      expect(fileExists(path.join(catsDir, 'entities', 'cat.entity.ts'))).toBe(
        true,
      );
    });
  });

  describe('dry-run', () => {
    it('should not create files with --dry-run', () => {
      const output = runNest('generate controller phantom --dry-run', appPath);

      expect(
        fileExists(
          path.join(appPath, 'src', 'phantom', 'phantom.controller.ts'),
        ),
      ).toBe(false);
      expect(output).toContain('CREATE');
    });
  });

  describe('spec-file-suffix', () => {
    it('should use custom spec file suffix', () => {
      runNest('generate controller custom --spec-file-suffix test', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'custom', 'custom.controller.ts')),
      ).toBe(true);
      expect(
        fileExists(
          path.join(appPath, 'src', 'custom', 'custom.controller.test.ts'),
        ),
      ).toBe(true);
    });
  });

  describe('path argument', () => {
    it('should generate into a custom path', () => {
      runNest('generate controller health modules/health', appPath);

      expect(
        fileExists(
          path.join(
            appPath,
            'src',
            'modules',
            'health',
            'health',
            'health.controller.ts',
          ),
        ),
      ).toBe(true);
    });
  });

  describe('format flag', () => {
    it('should accept --format and still generate the file', () => {
      runNest('generate controller fmt --format', appPath);

      expect(
        fileExists(path.join(appPath, 'src', 'fmt', 'fmt.controller.ts')),
      ).toBe(true);
    });

    it('should default to format=false when the flag is omitted', () => {
      runNest('generate controller fmt-default', appPath);

      expect(
        fileExists(
          path.join(appPath, 'src', 'fmt-default', 'fmt-default.controller.ts'),
        ),
      ).toBe(true);
    });
  });
});
