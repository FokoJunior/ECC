# Antigravity Setup and Usage Guide

Google Antigravity 2.0 discovers workspace customizations from the project-local
`.agents/` directory. Junior Dev's Antigravity target installs native rules, workflows,
skills, and custom agents into that directory.

Native Antigravity 2.0 installation requires Junior Dev 2.2.0 or newer. Junior Dev 2.1.0 uses
the legacy `.agent/` adapter and does not provide the native layout described
below.

## Quick start

Verify that 2.2.3 is readable from the registry, then run the pinned package
from the project you want to configure:

```bash
npm view junior-dev-universal@2.2.3 version
npx junior-dev-universal@2.2.3 install --profile minimal --target antigravity
```

### Source checkout alternative

```bash
# Run every command below from the project you want to configure.
# Keep the Junior Dev source checkout separate and use its absolute path.
JUNIOR_DEV_ROOT="/absolute/path/to/Junior Dev"

# Install the minimal profile
"$JUNIOR_DEV_ROOT/install.sh" --profile minimal --target antigravity

# Compatibility syntax: common rules plus only these language packs
"$JUNIOR_DEV_ROOT/install.sh" --target antigravity typescript python go
```

PowerShell uses the same project-root working-directory contract:

```powershell
$JuniorDevRoot = "C:\absolute\path\to\Junior Dev"

& "$JuniorDevRoot\install.ps1" --profile minimal --target antigravity
& "$JuniorDevRoot\install.ps1" --target antigravity typescript python go
```

Start a new Antigravity conversation after installing so the agent receives the
updated skill inventory.

## Native install mapping

| Junior Dev source | Antigravity destination | Purpose |
|---|---|---|
| `rules/` | `.agents/rules/` | Workspace rules, flattened with collision-safe names |
| `commands/` | `.agents/workflows/` | User-invoked slash workflows |
| `skills/<name>/` | `.agents/skills/<name>/` | Agent Skills with a required `SKILL.md` |
| `agents/<name>.md` | `.agents/agents/<name>.md` | Custom main agents and subagents |

Junior Dev does not copy the repository's `.agents/` directory wholesale. That source
tree is Codex packaging and contains Codex-specific marketplace metadata. An
Antigravity plugin instead requires `.agents/plugins/<plugin-name>/plugin.json`.

Installed custom agent definitions are adapted to Antigravity's frontmatter:
Claude model tiers become `flash` or `pro`, and Claude tool names become their
Antigravity equivalents. Unsupported tool identifiers are never emitted because
Antigravity warns that invalid tool names can hang custom-agent execution.

Installed rules receive the activation frontmatter Antigravity needs to attach
them: common rules use `trigger: always_on`, and language rules map their
Claude `paths:` scope to `trigger: glob` with matching `globs:`. Rules without
a trigger are present on disk but never loaded.

## Expected project tree

```text
your-project/
└── .agents/
    ├── rules/
    │   ├── common-coding-style.md
    │   └── typescript-testing.md
    ├── workflows/
    │   └── plan.md
    ├── skills/
    │   └── coding-standards/
    │       └── SKILL.md
    ├── agents/
    │   └── code-reviewer.md
    └── junior-dev-install-state.json
```

## Verify the installation

macOS and Linux:

```bash
node "$JUNIOR_DEV_ROOT/scripts/list-installed.js" --target antigravity
node "$JUNIOR_DEV_ROOT/scripts/doctor.js" --target antigravity
rg --files .agents/skills -g 'SKILL.md'
rg --files .agents/agents -g '*.md'
```

PowerShell:

```powershell
node "$JuniorDevRoot\scripts\list-installed.js" --target antigravity
node "$JuniorDevRoot\scripts\doctor.js" --target antigravity
Get-ChildItem .agents\skills -Recurse -Filter SKILL.md
Get-ChildItem .agents\agents -Recurse -Filter *.md
```

In Antigravity, open **Settings > Customizations**, confirm that workspace
skills appear, start a new conversation, and request one by its exact name.

## Existing `.agent/` installations

Antigravity still reads legacy `.agent/rules` and `.agent/skills`, but Junior Dev now
uses the canonical `.agents/` layout. Do not rename `.agent` manually because
Junior Dev install-state contains absolute managed paths.

Rerun the same Junior Dev install command after updating. Junior Dev writes and verifies the
new `.agents/junior-dev-install-state.json` first, then removes only unchanged files
owned by the valid legacy state. Modified and unmanaged files remain in
`.agent/` and remain discoverable by doctor and uninstall until handled.

Preview lifecycle operations before applying them when desired:

macOS and Linux:

```bash
node "$JUNIOR_DEV_ROOT/scripts/doctor.js" --target antigravity
node "$JUNIOR_DEV_ROOT/scripts/repair.js" --target antigravity --dry-run
node "$JUNIOR_DEV_ROOT/scripts/uninstall.js" --target antigravity --dry-run
```

PowerShell:

```powershell
node "$JuniorDevRoot\scripts\doctor.js" --target antigravity
node "$JuniorDevRoot\scripts\repair.js" --target antigravity --dry-run
node "$JuniorDevRoot\scripts\uninstall.js" --target antigravity --dry-run
```

## Troubleshooting

### Skills do not appear

- A valid skill must be `.agents/skills/<name>/SKILL.md`.
- `.agent/.agents/skills` is an obsolete nested layout from older Junior Dev builds.
- Start a new conversation after changing skill files.

### Rules do not apply

- Confirm the files are directly under `.agents/rules/`.
- Run doctor and inspect any missing or drifted managed-file warning.

### Workflows do not appear

- Confirm the files are under `.agents/workflows/`.
- Invoke a workflow with `/<workflow-name>` after restarting Antigravity.

## Native Plugin and Global Installation (`antigravity-home`)

Antigravity supports global plugins located in `~/.gemini/config/plugins/<name>/`. Installing Junior Dev as a native Antigravity plugin enables:

1. **Global Scope**: Junior Dev rules, skills, agents, workflows, and memory MCP are active across all projects automatically, without requiring a `.agents/` folder in every repository.
2. **Lifecycle Hooks (`hooks.json`)**: Handlers for `PreToolUse` command and file guards, `PostToolUse` edit tracking, and `Stop` formatting and diagnostics using Antigravity's protojson protocol (`{ decision, reason }`).
3. **Shared Memory Vault (`mcp_config.json`)**: Direct integration with `junior-dev-memory-mcp` across all Antigravity sessions.
4. **Native Plugin Manifest (`plugin.json`)**: Declares the Junior Dev plugin metadata.

### Installing Globally

```bash
# Using install.sh from source
"$JUNIOR_DEV_ROOT/install.sh" --target antigravity-home --profile core --enable-hooks
```

PowerShell:

```powershell
& "$JuniorDevRoot\install.ps1" --target antigravity-home --profile core --enable-hooks
```

The installer copies the memory server and its runtime dependencies into the
managed target. Only Junior Dev memory is included in the generated MCP configuration;
repository `.mcp.json` commands are not imported automatically. Set
`JUNIOR_DEV_DISABLED_MCPS=junior-dev-memory` during installation to omit that server.
Existing MCP entries are preserved on upgrades, including servers generated by
older Junior Dev versions. Review `mcp_config.json` and remove any unwanted existing
entries explicitly; installation does not delete user configuration.
Generated hook and MCP commands use absolute installed paths,
so they also work when Antigravity runs from another workspace.

Project-local hooks use the same runtime; select `--profile core --enable-hooks`
with `--target antigravity`. Use `--no-hooks` to omit automatic hooks.
On reinstall, `--no-hooks` also deactivates previously installed Junior Dev hooks,
including legacy bridges. Other hook namespaces are preserved. If the managed
`junior-dev-guard` registration was customized, installation refuses the change;
review that customization before retrying.
Choose a hook profile at installation with the existing environment setting, for
example `JUNIOR_DEV_HOOK_PROFILE=minimal "$JUNIOR_DEV_ROOT/install.sh" --target antigravity-home --profile core --enable-hooks`.
The installer retains it in managed `junior-dev/setup.json` for runtime execution.
`JUNIOR_DEV_HOOK_PROFILE` overrides that profile; `JUNIOR_DEV_DISABLED_HOOKS` disables individual
hook IDs, and `JUNIOR_DEV_DRY_RUN=1` suppresses hook execution. These controls also apply
to the Antigravity bridge.

### Global Plugin Structure

```text
~/.gemini/config/
├── workflows/               # Global slash workflows
└── plugins/junior-dev/
    ├── plugin.json          # Antigravity plugin manifest
    ├── hooks.json           # PreToolUse, PostToolUse, and Stop hooks
    ├── mcp_config.json      # Shared Junior Dev Memory Vault MCP server
    ├── junior-dev/setup.json       # Managed hook enable/profile configuration
    ├── rules/               # Rules applied to all workspaces
    ├── skills/              # Global Agent Skills
    ├── scripts/             # Hook bridge and memory runtime
    └── node_modules/        # Memory server dependencies
```

### Native validation and limits

Run the optional native check from the Junior Dev source checkout:

```bash
node tests/scripts/antigravity-native-plugin.test.js
```

The test requires an already installed **Antigravity CLI 1.3.5** and skips with an
explicit message if that version is unavailable. It does not download the CLI.
It installs Junior Dev into one temporary home, runs `agy plugin validate`, imports the
local plugin into a separate disposable CLI home with `agy plugin install`, and
checks `agy plugin list --json`.
Every CLI subprocess uses disposable home and configuration directories without
inheriting authentication credentials. The test makes no model requests.

This validates the CLI's local plugin importer and component registration.
CLI 1.2.9 does not list a manually placed `~/.gemini/config/plugins/junior-dev` plugin
until explicitly imported; its CLI staging location differs from the Antigravity
2.0 and IDE global location. Importing directly from the same home plugin directory
fails in CLI 1.2.9 because its importer attempts to copy onto the source directory.
The test uses separate install and loader homes to exercise the importer without
that collision; this does not establish in-place CLI activation of the home target.

The CLI exposes no standalone tool-event or Stop-event runner. The existing
bridge tests check allowed and denied tool payloads and Stop behavior directly;
they do **not** establish native loader execution. Automatic IDE discovery,
allowed and denied tool execution, and Stop execution still require a real
Antigravity session. In Settings > Customizations, verify Junior Dev appears, then use
a disposable workspace to verify an ordinary command proceeds, a destructive
command is denied before execution, and an edit triggers the expected Stop
formatting or diagnostics. Never use valuable files for the denial check.

## Official Antigravity references

- [Skills](https://antigravity.google/docs/skills)
- [Rules and workflows](https://antigravity.google/docs/rules-workflows)
- [Custom agents and subagents](https://antigravity.google/docs/subagents)
- [Plugins](https://antigravity.google/docs/plugins)
- [Lifecycle hooks](https://antigravity.google/docs/hooks)

See [CONTRIBUTING.md](../CONTRIBUTING.md) for Junior Dev contribution guidance and
[SELECTIVE-INSTALL-ARCHITECTURE.md](SELECTIVE-INSTALL-ARCHITECTURE.md) for the
installer lifecycle contract.
