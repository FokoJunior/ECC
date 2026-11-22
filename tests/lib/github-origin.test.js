'use strict';

const assert = require('assert');
const {
  normalizeGitHubGitOrigin,
} = require('../../scripts/lib/github-origin');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

console.log('\nGitHub origin normalization');

if (test('accepts only authenticated or TLS GitHub origins', () => {
  assert.strictEqual(
    normalizeGitHubGitOrigin('https://github.com/junior-dev/junior-dev.git'),
    'junior-dev/junior-dev'
  );
  assert.strictEqual(
    normalizeGitHubGitOrigin('ssh://git@github.com/junior-dev/junior-dev/'),
    'junior-dev/junior-dev'
  );
  assert.strictEqual(
    normalizeGitHubGitOrigin('git@github.com:junior-dev/junior-dev.git'),
    'junior-dev/junior-dev'
  );
})) passed++; else failed++;

if (test('rejects shorthand and insecure or unrelated origins', () => {
  assert.strictEqual(normalizeGitHubGitOrigin('junior-dev/junior-dev'), null);
  assert.strictEqual(
    normalizeGitHubGitOrigin('http://github.com/junior-dev/junior-dev.git'),
    null
  );
  assert.strictEqual(
    normalizeGitHubGitOrigin('https://example.com/junior-dev/junior-dev.git'),
    null
  );
  assert.strictEqual(normalizeGitHubGitOrigin(null), null);
})) passed++; else failed++;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
