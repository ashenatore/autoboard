#!/usr/bin/env node
/**
 * Post-edit hook: Console statement warning.
 * Warns about console.log statements that should be removed before committing.
 */

const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
  process.exit(0);
}

// Only check source files
if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) {
  process.exit(0);
}

try {
  const content = fs.readFileSync(filePath, 'utf8');

  // Check for various console statements
  const consolePatterns = [
    /\bconsole\.log\(/g,
    /\bconsole\.debug\(/g,
    /\bconsole\.info\(/g,
  ];

  const warnings = [];

  for (const pattern of consolePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      warnings.push(`Found ${matches.length} console statement(s)`);
    }
  }

  // Check for debugger statements
  if (/\bdebugger\b/g.test(content)) {
    warnings.push('Found debugger statement');
  }

  if (warnings.length > 0) {
    console.warn(`\x1b[33m[Hook]\x1b[0m ${warnings.join(', ')} in ${filePath}`);
    console.warn('  Consider removing before committing.');
  }
} catch (err) {
  // Fail silently if we can't read the file
  process.exit(0);
}
