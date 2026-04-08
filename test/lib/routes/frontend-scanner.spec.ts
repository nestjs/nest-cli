import { describe, it, expect, beforeEach } from 'vitest';
import { FrontendScanner } from '../../../lib/routes/frontend-scanner.js';

describe('FrontendScanner', () => {
  let scanner: FrontendScanner;

  beforeEach(() => {
    scanner = new FrontendScanner();
  });

  it('should detect axios.get(url)', () => {
    const calls = scanner.scanFiles([{
      path: 'api.ts',
      content: `axios.get('/api/users');`,
    }]);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/api/users', callType: 'axios' });
  });

  it('should detect axios.post(url)', () => {
    const calls = scanner.scanFiles([{
      path: 'api.ts',
      content: `axios.post('/api/users', body);`,
    }]);
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/api/users' });
  });

  it('should detect axios({ method, url }) object form', () => {
    const calls = scanner.scanFiles([{
      path: 'api.ts',
      content: `axios({ method: 'delete', url: '/api/users/1' });`,
    }]);
    expect(calls[0]).toMatchObject({ method: 'DELETE', url: '/api/users/1' });
  });

  it('should detect fetch(url) as GET by default', () => {
    const calls = scanner.scanFiles([{
      path: 'api.ts',
      content: `fetch('/api/products');`,
    }]);
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/api/products', callType: 'fetch' });
  });

  it('should detect fetch(url, { method }) for non-GET methods', () => {
    const calls = scanner.scanFiles([{
      path: 'api.ts',
      content: `fetch('/api/products', { method: 'POST', body: JSON.stringify(data) });`,
    }]);
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/api/products' });
  });

  it('should detect useQuery with a URL string', () => {
    const calls = scanner.scanFiles([{
      path: 'hook.ts',
      content: `const { data } = useQuery('/api/users', fetcher);`,
    }]);
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/api/users', callType: 'query-hook' });
  });

  it('should detect useSWR with a URL string', () => {
    const calls = scanner.scanFiles([{
      path: 'hook.ts',
      content: `const { data } = useSWR('/api/orders', fetcher);`,
    }]);
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/api/orders' });
  });

  it('should normalise :param segments', () => {
    expect(scanner.normalizeUrl('/api/users/:id')).toBe('/api/users/:param');
  });

  it('should normalise {param} segments', () => {
    expect(scanner.normalizeUrl('/api/users/{id}/profile')).toBe('/api/users/:param/profile');
  });

  it('should strip query strings', () => {
    expect(scanner.normalizeUrl('/api/users?page=1&limit=10')).toBe('/api/users');
  });

  it('should normalise template literal placeholders', () => {
    const calls = scanner.scanFiles([{
      path: 'api.ts',
      content: 'axios.get(`/api/users/${userId}/orders`);',
    }]);
    expect(calls[0].normalizedUrl).toBe('/api/users/:param/orders');
  });

  it('should return an empty array for files with no API calls', () => {
    const calls = scanner.scanFiles([{
      path: 'utils.ts',
      content: `const add = (a: number, b: number) => a + b;`,
    }]);
    expect(calls).toHaveLength(0);
  });

  it('should scan multiple files and aggregate results', () => {
    const calls = scanner.scanFiles([
      { path: 'users.ts', content: `axios.get('/api/users');` },
      { path: 'orders.ts', content: `fetch('/api/orders');` },
    ]);
    expect(calls).toHaveLength(2);
  });
});
