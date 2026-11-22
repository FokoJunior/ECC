# .pi — Pi Coding Agent Integration

This directory contains the **Pi adapter** for Junior Dev — a thin extension that connects the
[@earendil-works/pi-coding-agent](https://github.com/earendil-works/pi-coding-agent)
terminal coding agent to Junior Dev's canonical skills, prompts, and lifecycle hooks.

## Design Principle

Junior Dev's canonical assets—skills, agents, commands, and hooks—**remain the single source of truth**.
This adapter contains **only the integration logic**. No copies, no duplication.

## What This Provides

- **Junior Dev's skills** from `./skills/` — available in Pi as `/skill:<name>`
- **Junior Dev's commands** from `./commands/` — available in Pi as `/<name>`
- **Junior Dev's engineering rules** from `./rules/common/` — injected into Pi's system
  prompt on every turn, so coding style, testing, security, git workflow, and
  code-review standards apply in Pi as they do in other harnesses
- **Session lifecycle hooks** — Junior Dev's SessionStart and SessionEnd hooks, run through Junior Dev's own
  `run-with-flags.js`, so `JUNIOR_DEV_HOOK_PROFILE` and `JUNIOR_DEV_DISABLED_HOOKS` keep working under Pi
- **Session context injection** — whatever Junior Dev's SessionStart hook returns as
  `additionalContext` is folded into Pi's system prompt for the next turn
- **`/junior-dev-doctor`** — diagnostic command to verify the integration

Verified against Pi 0.84.1: a global install exposes 285 skills and 94 commands, resolved
directly from `skills/` and `commands/`, with no generated copies.

## Installation

### Option 1: Global Installation (Recommended)

```bash
# Install Junior Dev as a Pi package
pi install git:github.com/junior-dev/junior-dev

# Or from a local checkout
pi install /path/to/Junior Dev

# Or project-local only
pi install -l /path/to/Junior Dev

# Verify
pi list
```

Then inside Pi, run `/junior-dev-doctor` to confirm skills, commands, and hooks are available.

To uninstall:

```bash
pi remove git:github.com/junior-dev/junior-dev
```

### Option 2: Zero-Install (Existing Claude Code Users)

If you already have Junior Dev installed for Claude Code, point Pi at the same canonical directories
from `~/.pi/agent/settings.json`:

```json
{
  "skills": ["~/.claude/skills"],
  "prompts": ["~/.claude/commands"]
}
```

This gives you skills and commands directly. It does **not** include the lifecycle hook adapter
or `/junior-dev-doctor` — use Option 1 for the full integration.

## How It Works

The `extensions/index.ts` file handles:

1. **Skill and command mounting** — Pi reads `./skills` and `./commands` directly via the
   `pi` key in `package.json`. No transformation is needed: Junior Dev's `SKILL.md` files already
   follow the Agent Skills standard Pi implements, and Junior Dev's command frontmatter
   (`description`, `argument-hint`) is already Pi's prompt-template format
2. **Lifecycle hooks** — Maps Pi's `session_start` to Junior Dev's `session:start` hook
   (`scripts/hooks/session-start.js`) and Pi's `session_shutdown` to Junior Dev's `session:end:marker`
   hook (`scripts/hooks/session-end-marker.js`), both invoked through
   `scripts/hooks/run-with-flags.js` so Junior Dev's profile and disable flags are honored
3. **Rule injection** — Reads Junior Dev's portable engineering rules from the canonical
   `rules/common/` directory at runtime and appends them to the system prompt inside an
   `<junior-dev-engineering-rules>` block on every turn. Nothing is copied into `.pi/`.
   `agents.md`, `hooks.md`, and `performance.md` are excluded on purpose: they describe
   Claude Code primitives Pi does not have (Task/TodoWrite delegation, Claude hook event
   types, thinking-budget toggles), so injecting them would point the model at tools that
   are not there. Language-specific rules under `rules/<language>/` are not injected in this
   first adapter. Set `JUNIOR_DEV_PI_RULES` to `0`, `false`, `off`, `none`, or `disabled` to turn
   injection off; `/junior-dev-doctor` reports the current state and the injected size
4. **Context injection** — Parses `hookSpecificOutput.additionalContext` from the SessionStart
   hook and appends it to the system prompt on the next `before_agent_start`, wrapped in an
   `<junior-dev-session-context>` block. Non-JSON hook output is tolerated, not treated as an error
5. **Hook isolation** — Failing, missing, slow, or misconfigured hooks degrade to
   a warning and never terminate the Pi session. Hook execution is bounded by a
   timeout and an output limit
6. **Package resolution** — Resolves hook scripts from the installed package via `__dirname`,
   never from `process.cwd()`, so a global install works from any project directory. Hooks
   still *run* in the user's project directory, so project detection stays correct

All hook execution is non-shell (`execFile` without shell interpretation), so paths containing
spaces, tabs, or shell metacharacters are safe.

Hook runtime selection uses the host `process.execPath` only under Node.
Without an override, compiled OMP/Bun falls back to `node` instead of
recursively launching the OMP binary as a hook runner. Set `JUNIOR_DEV_HOOK_NODE` to
an explicit absolute Node executable path when `node` is not available on
`PATH`.
Relative values are rejected when the hook runs and surfaced as a warning.

## Scope

Intentionally **out of scope** for this first adapter (to be added independently):

- Subagent conversion and chains (need the `pi-subagents` companion package)
- Structured approval gates (need `@juicesharp/rpiv-ask-user-question`)
- Persistent todos (need `@juicesharp/rpiv-todo`)
- Profile-based resource filtering
- MCP translation — see below; no translation turned out to be necessary

Junior Dev works in Pi without any of these. Skills and commands are fully available today.

These capabilities are provided by existing community Pi packages rather than by
anything Junior Dev would need to write. This adapter deliberately does not bundle or
auto-install them: bundling would ship third-party code that executes with full
user permissions in every Junior Dev install, and would make optional capabilities
mandatory. Install whichever you want yourself — `/junior-dev-doctor` reports which are
present and prints the exact `pi install` command for the ones that are not.

### MCP

Pi core has no MCP surface by design. The community `pi-mcp-adapter` package
adds one, and it reads the standard `mcpServers` format from `.mcp.json` and
`~/.config/mcp/mcp.json` — which is exactly the format Junior Dev already uses in
`.mcp.json` and `mcp-configs/mcp-servers.json`.

Verified against `pi-mcp-adapter` 2.21.2: copying Junior Dev's `mcp-configs/mcp-servers.json`
to a project's `.mcp.json` registers Pi's `mcp` tool and `/mcp` command with all
35 Junior Dev servers discovered, alongside this adapter's own `/junior-dev-doctor`. No
translation layer is needed and no Junior Dev change is required.

```bash
pi install npm:pi-mcp-adapter
cp mcp-configs/mcp-servers.json /path/to/project/.mcp.json
```

Junior Dev neither installs nor depends on that package. Two caveats: the adapter's
first run against a new config performs initialization that blocks in
non-interactive (`-p`) mode, so run it once interactively before using it
headless; and only server discovery was verified, not live tool invocation,
which needs real credentials for each server.

## Security

- Pi extensions run with the same OS permissions as the Pi process
- This adapter does **not** auto-commit, push, merge, or deploy
- Hooks are executed without a shell, preventing command injection
- Hook failures are isolated and cannot silently authorize blocked operations

## Troubleshooting

### Skills or commands not showing up

**Cause:** the package's resources are disabled, or a project-local install has not been
trusted. Pi asks before trusting a project folder that carries its own `.pi/` resources.

**Fix:** run `pi config` and confirm the Junior Dev package's skills and prompts are enabled
(<kbd>Tab</kbd> switches between user and project scope). Then confirm the package itself is
registered with `pi list`.

### `/junior-dev-doctor` not found or reports missing package root

**Cause:** Extension not loaded or package installed incorrectly.

**Fix:**
1. Run `pi list` to confirm Junior Dev is registered
2. Restart Pi: exit and reopen the session
3. Run `/junior-dev-doctor` again

`/junior-dev-doctor` prints the resolved package root, the skill and command counts it found, the
hook runner path, the active hook profile, and which optional companion packages are present.
A `NOT FOUND` line points at the specific path that failed to resolve.

### Hooks not firing

**Cause:** the extension is not loaded, or the hooks are gated off by an Junior Dev hook profile.

**Fix:**
1. Confirm `pi list` shows Junior Dev and that `/junior-dev-doctor` reports the hook runner as found
2. Check `JUNIOR_DEV_HOOK_PROFILE` and `JUNIOR_DEV_DISABLED_HOOKS` — `/junior-dev-doctor` prints both. A hook
   listed in `JUNIOR_DEV_DISABLED_HOOKS` is skipped by design
3. Restart Pi so the extension reloads

## Notes

- The `.pi/extensions/` directory is the only place for adapter code
- Skills and commands are defined in the repo root (`skills/`, `commands/`) and referenced by Pi
- MCP is not bundled, but Junior Dev's MCP configs load in Pi through the community `pi-mcp-adapter` — see [MCP](#mcp) above
- This adapter was tested against Pi v0.84.1
