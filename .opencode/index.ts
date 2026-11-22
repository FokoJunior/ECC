/**
 * Junior Dev Plugin for OpenCode
 *
 * This package provides the published Junior Dev OpenCode plugin module:
 * - Plugin hooks (auto-format, TypeScript check, console.log warning, env injection, etc.)
 * - Custom tools (run-tests, check-coverage, security-audit, format-code, lint-check, git-summary)
 * - Bundled reference config/assets for the wider Junior Dev OpenCode setup
 *
 * Usage:
 *
 * Option 1: Install via npm
 * ```bash
 * npm install junior-dev-universal
 * ```
 *
 * Then add to your opencode.json:
 * ```json
 * {
 *   "plugin": ["junior-dev-universal"]
 * }
 * ```
 *
 * That enables the published plugin module only. For Junior Dev commands, agents,
 * prompts, and instructions, use this repository's `.opencode/opencode.json`
 * as a base or copy the bundled `.opencode/` assets into your project.
 *
 * Option 2: Clone and use directly
 * ```bash
 * git clone https://github.com/junior-dev/junior-dev
 * cd Junior Dev
 * opencode
 * ```
 *
 * @packageDocumentation
 */

// Export the main plugin
// The default package export targets OpenCode 2.x's definition loader.
// OpenCode 1.x's function-only loader cannot load this package entry. The
// named V1 factory in plugins/junior-dev-hooks.ts is retained for migration only.
export { default } from "./plugins/junior-dev-hooks.ts"
