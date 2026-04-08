import { describe, it, expect, beforeEach } from 'vitest';
import { RouteExtractor } from '../../../lib/routes/route-extractor.js';

describe('RouteExtractor', () => {
  let extractor: RouteExtractor;

  beforeEach(() => {
    extractor = new RouteExtractor();
  });

  it('should extract a single GET route from a controller', () => {
    const routes = extractor.extractRoutesFromFiles([{
      path: 'users.controller.ts',
      content: `
        import { Controller, Get } from '@nestjs/common';
        @Controller('users')
        export class UsersController {
          @Get()
          findAll() {}
        }
      `,
    }]);

    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      method: 'GET',
      fullPath: '/users',
      controller: 'UsersController',
      handler: 'findAll',
    });
  });

  it('should extract a route with a path parameter', () => {
    const routes = extractor.extractRoutesFromFiles([{
      path: 'users.controller.ts',
      content: `
        import { Controller, Get } from '@nestjs/common';
        @Controller('users')
        export class UsersController {
          @Get(':id')
          findOne() {}
        }
      `,
    }]);

    expect(routes[0].fullPath).toBe('/users/:id');
    expect(routes[0].path).toBe(':id');
  });

  it('should extract multiple HTTP method decorators from one controller', () => {
    const routes = extractor.extractRoutesFromFiles([{
      path: 'users.controller.ts',
      content: `
        import { Controller, Get, Post, Put, Delete, Patch } from '@nestjs/common';
        @Controller('users')
        export class UsersController {
          @Get()       findAll() {}
          @Get(':id')  findOne() {}
          @Post()      create() {}
          @Put(':id')  update() {}
          @Patch(':id') patch() {}
          @Delete(':id') remove() {}
        }
      `,
    }]);

    expect(routes).toHaveLength(6);
    expect(routes.map((r) => r.method)).toEqual(
      expect.arrayContaining(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    );
  });

  it('should return an empty array for a class without @Controller', () => {
    const routes = extractor.extractRoutesFromFiles([{
      path: 'service.ts',
      content: `
        import { Injectable } from '@nestjs/common';
        @Injectable()
        export class UsersService {
          findAll() { return []; }
        }
      `,
    }]);

    expect(routes).toHaveLength(0);
  });

  it('should correctly join controller prefix with method path', () => {
    const routes = extractor.extractRoutesFromFiles([{
      path: 'api.controller.ts',
      content: `
        import { Controller, Get } from '@nestjs/common';
        @Controller('api/v1')
        export class ApiController {
          @Get('resource/:id')
          getResource() {}
        }
      `,
    }]);

    expect(routes[0].fullPath).toBe('/api/v1/resource/:id');
  });

  it('should handle a controller with no prefix', () => {
    const routes = extractor.extractRoutesFromFiles([{
      path: 'root.controller.ts',
      content: `
        import { Controller, Get } from '@nestjs/common';
        @Controller()
        export class RootController {
          @Get('health')
          health() {}
        }
      `,
    }]);

    expect(routes[0].fullPath).toBe('/health');
  });

  it('should handle a method decorator with no path argument', () => {
    const routes = extractor.extractRoutesFromFiles([{
      path: 'items.controller.ts',
      content: `
        import { Controller, Get } from '@nestjs/common';
        @Controller('items')
        export class ItemsController {
          @Get()
          findAll() {}
        }
      `,
    }]);

    expect(routes[0].fullPath).toBe('/items');
  });

  it('should extract routes from multiple controller files', () => {
    const routes = extractor.extractRoutesFromFiles([
      {
        path: 'users.controller.ts',
        content: `
          import { Controller, Get } from '@nestjs/common';
          @Controller('users')
          export class UsersController {
            @Get() findAll() {}
          }
        `,
      },
      {
        path: 'orders.controller.ts',
        content: `
          import { Controller, Post } from '@nestjs/common';
          @Controller('orders')
          export class OrdersController {
            @Post() create() {}
          }
        `,
      },
    ]);

    expect(routes).toHaveLength(2);
    expect(routes.map((r) => r.controller)).toEqual(
      expect.arrayContaining(['UsersController', 'OrdersController']),
    );
  });

  it('should record the correct file path and line number', () => {
    const routes = extractor.extractRoutesFromFiles([{
      path: 'src/users/users.controller.ts',
      content: `
        import { Controller, Get } from '@nestjs/common';
        @Controller('users')
        export class UsersController {
          @Get()
          findAll() {}
        }
      `,
    }]);

    expect(routes[0].file).toContain('users.controller.ts');
    expect(routes[0].line).toBeGreaterThan(0);
  });

  it('should gracefully skip files with parse errors', () => {
    const routes = extractor.extractRoutesFromFiles([
      { path: 'bad.controller.ts', content: '<<< NOT VALID TYPESCRIPT' },
      {
        path: 'good.controller.ts',
        content: `
          import { Controller, Get } from '@nestjs/common';
          @Controller('ok')
          export class OkController {
            @Get() ping() {}
          }
        `,
      },
    ]);

    expect(routes).toHaveLength(1);
    expect(routes[0].controller).toBe('OkController');
  });
});
