/**
 * Static Wiring Check Script
 * Scans src/ for all /api/v1/... endpoint invocations and verifies:
 * 1. A matching route.ts file exists under src/app/api/v1/...
 * 2. The matching route.ts exports the required HTTP method (GET, POST, PUT, DELETE, PATCH)
 * 3. Reports 0 unmatched paths
 */

import fs from 'fs';
import path from 'path';

interface ApiCall {
  file: string;
  line: number;
  method: string;
  endpoint: string;
  normalizedPattern: string;
}

interface RouteInfo {
  routePath: string; // e.g. /api/v1/od-requests/[id]
  filePath: string;
  exportedMethods: Set<string>;
}

// 1. Discover all routes in src/app/api/v1
const routesRoot = path.join(process.cwd(), 'src', 'app', 'api', 'v1');
const availableRoutes = new Map<string, RouteInfo>();

function scanRoutes(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanRoutes(fullPath);
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      const relative = path.relative(path.join(process.cwd(), 'src', 'app'), dir);
      const routePath = '/' + relative.replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const exportedMethods = new Set<string>();
      const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\b/g;
      let match;
      while ((match = methodRegex.exec(content)) !== null) {
        exportedMethods.add(match[1]);
      }

      availableRoutes.set(routePath, {
        routePath,
        filePath: fullPath,
        exportedMethods,
      });
    }
  }
}

scanRoutes(routesRoot);

// 2. Scan src/ for API calls (excluding src/app/api to avoid self-reference)
const calls: ApiCall[] = [];

function normalizePattern(urlPattern: string): string {
  // Strip query template expressions like ${query} or ${searchParams}
  let clean = urlPattern.replace(/\$\{[^}]*query[^}]*\}/gi, '');
  clean = clean.replace(/\$\{[^}]*param[^}]*\}/gi, '');
  // Strip standard query string '?foo=bar'
  clean = clean.split('?')[0];
  // Strip trailing slash before replacing params
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  // Replace ${...} dynamic variables with [id]
  clean = clean.replace(/\$\{[^}]+\}/g, '[id]');
  // Replace {param} or :param with [id]
  clean = clean.replace(/\{[^}]+\}/g, '[id]');
  clean = clean.replace(/:[a-zA-Z0-9_]+/g, '[id]');
  return clean;
}

function scanCallsInFile(filePath: string) {
  // Skip route definitions themselves and types/serializers/mocks
  if (filePath.includes(path.join('src', 'app', 'api'))) return;
  if (filePath.endsWith('.d.ts')) return;

  const content = fs.readFileSync(filePath, 'utf8');

  // Match apiClient calls (single line or multi-line)
  const apiCallRegex = /apiClient\.(get|post|put|delete|patch|getText|upload)(?:<[^>]+>)?\s*\(\s*[`'"](\/api\/v1\/[^`'"]+)[`'"]/gs;
  let match;
  while ((match = apiCallRegex.exec(content)) !== null) {
    let method = match[1].toUpperCase();
    if (method === 'GETTEXT') method = 'GET';
    if (method === 'UPLOAD') method = 'POST';
    const rawEndpoint = match[2];
    const lineNum = content.substring(0, match.index).split('\n').length;
    calls.push({
      file: path.relative(process.cwd(), filePath),
      line: lineNum,
      method,
      endpoint: rawEndpoint,
      normalizedPattern: normalizePattern(rawEndpoint),
    });
  }

  // Match fetch calls: fetch(`/api/v1/...`, { ... method: 'POST' ... })
  const fetchRegex = /fetch\s*\(\s*[`'"](\/api\/v1\/[^`'"]+)[`'"](?:\s*,\s*\{([^}]*)\})?/gs;
  while ((match = fetchRegex.exec(content)) !== null) {
    const rawEndpoint = match[1];
    const optionsBlock = match[2] || '';
    let method = 'GET';
    if (/method:\s*['"]POST['"]/i.test(optionsBlock)) method = 'POST';
    else if (/method:\s*['"]PUT['"]/i.test(optionsBlock)) method = 'PUT';
    else if (/method:\s*['"]DELETE['"]/i.test(optionsBlock)) method = 'DELETE';
    else if (/method:\s*['"]PATCH['"]/i.test(optionsBlock)) method = 'PATCH';

    const lineNum = content.substring(0, match.index).split('\n').length;
    calls.push({
      file: path.relative(process.cwd(), filePath),
      line: lineNum,
      method,
      endpoint: rawEndpoint,
      normalizedPattern: normalizePattern(rawEndpoint),
    });
  }

  // Match helper url returns like `return `/api/v1/records/export${query}`;`
  const helperRegex = /return\s+[`'"](\/api\/v1\/[^`'"]+)[`'"]/g;
  while ((match = helperRegex.exec(content)) !== null) {
    const rawEndpoint = match[1];
    const lineNum = content.substring(0, match.index).split('\n').length;
    calls.push({
      file: path.relative(process.cwd(), filePath),
      line: lineNum,
      method: 'GET',
      endpoint: rawEndpoint,
      normalizedPattern: normalizePattern(rawEndpoint),
    });
  }
}

function scanSrc(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanSrc(fullPath);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      scanCallsInFile(fullPath);
    }
  }
}

scanSrc(path.join(process.cwd(), 'src'));

console.log('========================================================================');
console.log('STATIC WIRING VERIFICATION: /api/v1/... ENDPOINTS TO route.ts HANDLERS');
console.log('========================================================================\n');

console.log(`Discovered ${availableRoutes.size} API route handlers under src/app/api/v1:\n`);
for (const [route, info] of Array.from(availableRoutes.entries()).sort()) {
  const methods = Array.from(info.exportedMethods).join(', ');
  console.log(`  ✓ ${route} [${methods}]`);
}

console.log(`\nDiscovered ${calls.length} API client call sites across src/ frontend code:\n`);

let unmatchedCount = 0;
const checkedCombinations = new Set<string>();

for (const call of calls) {
  const key = `${call.method} ${call.normalizedPattern}`;
  let matchedRoute: RouteInfo | undefined;

  for (const [routePath, routeInfo] of availableRoutes.entries()) {
    const regexPattern = '^' + routePath
      .replace(/\[\w+\]/g, '[^/]+')
      .replace(/\//g, '\\/') + '$';
    const regex = new RegExp(regexPattern);
    
    if (regex.test(call.normalizedPattern) || regex.test(call.endpoint)) {
      matchedRoute = routeInfo;
      break;
    }
  }

  if (!matchedRoute) {
    console.error(`  ✗ [UNMATCHED ROUTE] ${call.method} ${call.endpoint} (normalized: ${call.normalizedPattern}) (${call.file}:${call.line})`);
    unmatchedCount++;
  } else if (!matchedRoute.exportedMethods.has(call.method)) {
    console.error(`  ✗ [UNSUPPORTED METHOD] ${call.method} ${call.endpoint} -> Route ${matchedRoute.routePath} only exports [${Array.from(matchedRoute.exportedMethods).join(', ')}] (${call.file}:${call.line})`);
    unmatchedCount++;
  } else {
    if (!checkedCombinations.has(key)) {
      console.log(`  ✓ [MATCHED] ${call.method} ${call.normalizedPattern} -> ${matchedRoute.routePath} [${Array.from(matchedRoute.exportedMethods).join(', ')}]`);
      checkedCombinations.add(key);
    }
  }
}

console.log('\n------------------------------------------------------------------------');
console.log(`Total API call sites checked: ${calls.length}`);
console.log(`Unique endpoint patterns:    ${checkedCombinations.size}`);
console.log(`Unmatched paths/methods:     ${unmatchedCount}`);
console.log('------------------------------------------------------------------------\n');

if (unmatchedCount > 0) {
  console.error(`>>> WIRING CHECK FAILED: Found ${unmatchedCount} unmatched API calls! <<<`);
  process.exit(1);
} else {
  console.log('>>> WIRING CHECK PASSED: Zero unmatched API paths! All endpoints wired properly. <<<\n');
}
