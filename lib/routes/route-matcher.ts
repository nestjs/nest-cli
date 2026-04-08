import { BackendRoute } from './route-extractor.js';
import { FrontendApiCall, FrontendScanner } from './frontend-scanner.js';

export interface AnalysisSummary {
  totalBackendRoutes: number;
  totalFrontendCalls: number;
  usedCount: number;
  unusedCount: number;
  ambiguousCount: number;
  coveragePercent: number;
  riskScore: 'low' | 'medium' | 'high' | 'critical';
}

export interface RouteAnalysisResult {
  usedRoutes: BackendRoute[];
  unusedRoutes: BackendRoute[];
  ambiguousRoutes: BackendRoute[];
  frontendCalls: FrontendApiCall[];
  summary: AnalysisSummary;
}

export class RouteMatcher {
  constructor(private readonly scanner: FrontendScanner) {}

  match(
    backendRoutes: BackendRoute[],
    frontendCalls: FrontendApiCall[],
  ): RouteAnalysisResult {
    const used: BackendRoute[] = [];
    const unused: BackendRoute[] = [];
    const ambiguous: BackendRoute[] = [];

    for (const route of backendRoutes) {
      const result = this.matchRoute(route, frontendCalls);
      if (result === 'used') used.push(route);
      else if (result === 'ambiguous') ambiguous.push(route);
      else unused.push(route);
    }

    const summary = this.buildSummary(backendRoutes, frontendCalls, used, unused, ambiguous);
    return { usedRoutes: used, unusedRoutes: unused, ambiguousRoutes: ambiguous, frontendCalls, summary };
  }

  private matchRoute(route: BackendRoute, calls: FrontendApiCall[]): 'used' | 'unused' | 'ambiguous' {
    const pattern = this.routeToRegex(route.fullPath);

    for (const call of calls) {
      const methodMatch =
        call.method === 'unknown' ||
        call.method.toUpperCase() === route.method.toUpperCase();

      if (!methodMatch) continue;
      if (pattern.test(call.normalizedUrl)) return 'used';
      if (this.fuzzyMatch(route.fullPath, call.normalizedUrl)) return 'ambiguous';
    }

    return 'unused';
  }

  private routeToRegex(routePath: string): RegExp {
    const escaped = routePath
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, '[^/]+')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`, 'i');
  }

  private fuzzyMatch(routePath: string, callUrl: string): boolean {
    const segments = routePath
      .split('/')
      .filter((s) => s && !s.startsWith(':') && s !== '*');
    if (segments.length === 0) return false;
    const lower = callUrl.toLowerCase();
    return segments.every((s) => lower.includes(s.toLowerCase()));
  }

  private buildSummary(
    all: BackendRoute[],
    calls: FrontendApiCall[],
    used: BackendRoute[],
    unused: BackendRoute[],
    ambiguous: BackendRoute[],
  ): AnalysisSummary {
    const total = all.length;
    const coveragePercent =
      total === 0
        ? 100
        : Math.round(((used.length + ambiguous.length * 0.5) / total) * 100);

    const unusedPct = total === 0 ? 0 : (unused.length / total) * 100;
    let riskScore: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (unusedPct > 60) riskScore = 'critical';
    else if (unusedPct > 40) riskScore = 'high';
    else if (unusedPct > 20) riskScore = 'medium';

    return {
      totalBackendRoutes: total,
      totalFrontendCalls: calls.length,
      usedCount: used.length,
      unusedCount: unused.length,
      ambiguousCount: ambiguous.length,
      coveragePercent,
      riskScore,
    };
  }
}
