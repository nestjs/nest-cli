import { describe, it, expect, beforeEach } from 'vitest';
import { RouteMatcher } from '../../../lib/routes/route-matcher.js';
import { FrontendScanner } from '../../../lib/routes/frontend-scanner.js';
import { BackendRoute } from '../../../lib/routes/route-extractor.js';
import { FrontendApiCall } from '../../../lib/routes/frontend-scanner.js';

const makeRoute = (method: string, fullPath: string): BackendRoute => ({
  method: method as any,
  path: fullPath.split('/').pop() ?? '',
  fullPath,
  controller: 'TestController',
  handler: 'testHandler',
  file: 'test.controller.ts',
  line: 1,
});

const makeCall = (method: string, url: string): FrontendApiCall => {
  const scanner = new FrontendScanner();
  return {
    method: method as any,
    url,
    normalizedUrl: scanner.normalizeUrl(url),
    file: 'api.ts',
    line: 1,
    callType: 'axios',
  };
};

describe('RouteMatcher', () => {
  let matcher: RouteMatcher;

  beforeEach(() => {
    matcher = new RouteMatcher(new FrontendScanner());
  });

  it('should mark a route as used when a frontend call matches exactly', () => {
    const result = matcher.match(
      [makeRoute('GET', '/api/users')],
      [makeCall('GET', '/api/users')],
    );
    expect(result.usedRoutes).toHaveLength(1);
    expect(result.unusedRoutes).toHaveLength(0);
  });

  it('should match a route with a path param against a concrete URL', () => {
    const result = matcher.match(
      [makeRoute('GET', '/api/users/:id')],
      [makeCall('GET', '/api/users/42')],
    );
    expect(result.usedRoutes).toHaveLength(1);
  });

  it('should match a route param against a normalised :param frontend call', () => {
    const result = matcher.match(
      [makeRoute('DELETE', '/api/orders/:id')],
      [makeCall('DELETE', '/api/orders/:param')],
    );
    expect(result.usedRoutes).toHaveLength(1);
  });

  it('should match regardless of HTTP method casing', () => {
    const result = matcher.match(
      [makeRoute('POST', '/api/users')],
      [makeCall('post', '/api/users')],
    );
    expect(result.usedRoutes).toHaveLength(1);
  });

  it('should mark a route as unused when no frontend call matches', () => {
    const result = matcher.match(
      [makeRoute('GET', '/api/reports/export')],
      [makeCall('GET', '/api/users')],
    );
    expect(result.unusedRoutes).toHaveLength(1);
    expect(result.unusedRoutes[0].fullPath).toBe('/api/reports/export');
  });

  it('should mark a route as unused when the method does not match', () => {
    const result = matcher.match(
      [makeRoute('DELETE', '/api/users/:id')],
      [makeCall('GET', '/api/users/1')],
    );
    expect(result.unusedRoutes).toHaveLength(1);
  });

  it('should return all routes as unused when there are no frontend calls', () => {
    const result = matcher.match(
      [makeRoute('GET', '/api/a'), makeRoute('POST', '/api/b')],
      [],
    );
    expect(result.unusedRoutes).toHaveLength(2);
    expect(result.usedRoutes).toHaveLength(0);
  });

  it('should compute correct summary counts', () => {
    const { summary } = matcher.match(
      [makeRoute('GET', '/api/users'), makeRoute('POST', '/api/users'), makeRoute('DELETE', '/api/users/:id')],
      [makeCall('GET', '/api/users'), makeCall('POST', '/api/users')],
    );
    expect(summary.totalBackendRoutes).toBe(3);
    expect(summary.usedCount).toBe(2);
    expect(summary.unusedCount).toBe(1);
  });

  it('should return 100% coverage and low risk when all routes are used', () => {
    const { summary } = matcher.match(
      [makeRoute('GET', '/api/users')],
      [makeCall('GET', '/api/users')],
    );
    expect(summary.coveragePercent).toBe(100);
    expect(summary.riskScore).toBe('low');
  });

  it('should return critical risk when more than 60% of routes are unused', () => {
    const routes = Array.from({ length: 10 }, (_, i) => makeRoute('GET', `/api/route-${i}`));
    const { summary } = matcher.match(routes, [makeCall('GET', '/api/route-0')]);
    expect(summary.riskScore).toBe('critical');
  });

  it('should give 100% coverage when there are no backend routes', () => {
    const { summary } = matcher.match([], [makeCall('GET', '/api/users')]);
    expect(summary.coveragePercent).toBe(100);
    expect(summary.riskScore).toBe('low');
  });
});
