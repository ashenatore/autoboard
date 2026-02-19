#!/usr/bin/env node
/**
 * Post-edit hook: TypeScript type checking.
 * Runs TypeScript compiler on edited files to catch type errors early.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
  process.exit(0);
}

// Only check TypeScript files
if (!/\.(ts|tsx)$/.test(filePath)) {
  process.exit(0);
}

// Find nearest package.json to determine workspace package
let dir = path.dirname(path.resolve(filePath));
let tsconfigPath = null;

for (let i = 0; i < 20; i++) {
  const candidate = path.join(dir, 'tsconfig.json');
  if (fs.existsSync(candidate)) {
    tsconfigPath = candidate;
    break;
  }
  const parent = path.dirname(dir);
  if (parent === dir) break;
  dir = parent;
}

// No tsconfig found, skip check
if (!tsconfigPath) {
  process.exit(0);
}

try {
  execSync(`npx tsc --noEmit -p ${tsconfigPath}`, {
    cwd: path.dirname(tsconfigPath),
    stdio: 'pipe',
    timeout: 30000
  });
} catch (err) {
  const errors = err.stdout?.toString() || err.stderr?.toString();
  if (errors) {
    // Filter errors to only show those related to the edited file
    const filtered = errors.split('\n')
      .filter(line => line.includes(filePath) || line.includes('error TS'))
      .join('\n');

    if (filtered) {
      console.error(`\x1b[33m[Hook]\x1b[0m TypeScript errors in ${filePath}:\n${filtered}`);
    }
  }
}
