'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { toCursorAgentFileName, toCursorAgentRelativePath } = require('../../scripts/lib/cursor-agent-names');

test('a bare file name gets the junior-dev- prefix', () => {
  assert.equal(toCursorAgentFileName('planner.md'), 'junior-dev-planner.md');
  assert.equal(toCursorAgentFileName('code-reviewer.md'), 'junior-dev-code-reviewer.md');
});

test('an already prefixed name is left alone, so the transform is idempotent', () => {
  assert.equal(toCursorAgentFileName('junior-dev-planner.md'), 'junior-dev-planner.md');
  assert.equal(toCursorAgentFileName(toCursorAgentFileName('planner.md')), 'junior-dev-planner.md');
});

test('empty and missing names pass through unchanged', () => {
  assert.equal(toCursorAgentFileName(''), '');
  assert.equal(toCursorAgentFileName(undefined), undefined);
  assert.equal(toCursorAgentFileName(null), null);
});

test('only a leading, lowercase junior-dev- counts as the prefix', () => {
  assert.equal(toCursorAgentFileName('my-junior-dev-agent.md'), 'junior-dev-my-junior-dev-agent.md');
  assert.equal(toCursorAgentFileName('JUNIOR-DEV-planner.md'), 'junior-dev-JUNIOR-DEV-planner.md');
  assert.equal(toCursorAgentFileName('junior-dev.md'), 'junior-dev-junior-dev.md');
  assert.equal(toCursorAgentFileName('junior_dev_planner.md'), 'junior-dev-junior_dev_planner.md');
});

test('a relative path keeps its directories and renames only the last segment', () => {
  assert.equal(toCursorAgentRelativePath('review/planner.md'), path.join('review', 'junior-dev-planner.md'));
  assert.equal(toCursorAgentRelativePath('a/b/c.md'), path.join('a', 'b', 'junior-dev-c.md'));
  assert.equal(toCursorAgentRelativePath('junior-dev-review/planner.md'), path.join('junior-dev-review', 'junior-dev-planner.md'));
});

test('a path without directories behaves like a bare file name', () => {
  assert.equal(toCursorAgentRelativePath('planner.md'), 'junior-dev-planner.md');
  assert.equal(toCursorAgentRelativePath('junior-dev-planner.md'), 'junior-dev-planner.md');
});

test('backslash and repeated separators are normalized to the platform separator', () => {
  assert.equal(toCursorAgentRelativePath('review\\planner.md'), path.join('review', 'junior-dev-planner.md'));
  assert.equal(toCursorAgentRelativePath('review//planner.md'), path.join('review', 'junior-dev-planner.md'));
  assert.equal(toCursorAgentRelativePath('review\\\\sub/planner.md'), path.join('review', 'sub', 'junior-dev-planner.md'));
});

test('a trailing separator is dropped and the last real segment is renamed', () => {
  assert.equal(toCursorAgentRelativePath('review/planner.md/'), path.join('review', 'junior-dev-planner.md'));
});

test('empty, missing, and separator-only paths come back unchanged', () => {
  assert.equal(toCursorAgentRelativePath(''), '');
  assert.equal(toCursorAgentRelativePath(undefined), undefined);
  assert.equal(toCursorAgentRelativePath(null), null);
  assert.equal(toCursorAgentRelativePath('/'), '/');
  assert.equal(toCursorAgentRelativePath('\\\\'), '\\\\');
});

test('the result is always relative to the destination root', () => {
  // The executor joins the result under the target agents directory, so a
  // leading separator must not be able to re-root the destination.
  const result = toCursorAgentRelativePath('/etc/planner.md');
  assert.equal(result, path.join('etc', 'junior-dev-planner.md'));
  assert.equal(path.isAbsolute(result), false);
});

test('dot segments are not interpreted; the transform renames, it does not resolve', () => {
  // The executor walks real directory entries, so these never reach the
  // transform in practice. Pin that it does not quietly collapse them either.
  assert.equal(toCursorAgentRelativePath('./planner.md'), path.join('.', 'junior-dev-planner.md'));
  assert.equal(toCursorAgentRelativePath('../planner.md'), path.join('..', 'junior-dev-planner.md'));
});

test('the relative path transform composes the file name transform', () => {
  for (const file of ['planner.md', 'junior-dev-planner.md', 'README']) {
    assert.equal(toCursorAgentRelativePath(`nested/${file}`), path.join('nested', toCursorAgentFileName(file)));
  }
});
