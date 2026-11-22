'use strict';

/**
 * Antigravity Plugin Manifest Generator
 *
 * Generates valid Antigravity plugin.json declaring the Junior Dev plugin.
 */

function buildAntigravityPluginManifest(options = {}) {
  const version = options.version || require('../../package.json').version;
  return {
    name: 'junior-dev',
    description: 'Junior Dev - The Agent Harness Operating System for Antigravity',
    version,
  };
}

module.exports = {
  buildAntigravityPluginManifest,
};
