#!/usr/bin/env node
/**
 * Post-edit hook: Prettier formatting.
 * Auto-formats edited files to maintain consistent code style.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
  process.exit(0);
}

// File extensions that Prettier should handle
const extensibilityRegex = /\.(ts|tsx|js|jsx|json|md|css|scss|less|html|yaml|yml)$/i;
if (!extensibilityRegex.test(filePath)) {
  process.exit(0);
}

// Check if Prettier is available
let prettierPath = null;
let dir = path.dirname(path.resolve(filePath));

for (let i = 0; i < 10; i++) {
  const nodeModules = path.join(dir, 'node_modules', '.bin', 'prettier');
  if (fs.existsSync(nodeModules)) {
    prettierPath = nodeModules;
    break;
  }

  // Also check for pnpm
  const pnpmModules = path.join(dir, 'node_modules', '.pnpm');
  if (fs.existsSync(pnpmModules)) {
    prettierPath = 'npx prettier';
    break;
  }

  const parent = path.dirname(dir);
  if (parent === dir) break;
  dir = parent;
}

// No Prettier found, skip formatting
if (!prettierPath) {
  process.exit(0);
}

try {
  execSync(`"${prettierPath}" --write "${filePath}"`, {
    cwd: path.dirname(filePath),
    stdio: 'pipe',
    timeout: 15000
  });
} catch (err) {
  // Fail silently if formatting fails
  process.exit(0);
}
