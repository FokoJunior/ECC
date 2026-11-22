# Mistral Vibe integration

Junior Dev provides a project-local, skills-first integration for Mistral Vibe. The
contract in this guide is verified against **Mistral Vibe v2.25.3** and
**Mistral Vibe v3.1.2**.

## Install a skill

Run the installer from the project that Vibe will open. Keep the Junior Dev source
checkout separate so managed files are written to the target project:

```bash
JUNIOR_DEV_ROOT="/absolute/path/to/Junior Dev"
"$JUNIOR_DEV_ROOT/install.sh" --target mistral-vibe --skills tdd-workflow
```

After a release containing this target is published, verify the registry
version and pin that released version:

```bash
npm view junior-dev-universal version
npx junior-dev-universal@<released-version> install --target mistral-vibe --skills tdd-workflow
```

Install multiple skills with a comma-separated list:

```bash
"$JUNIOR_DEV_ROOT/install.sh" --target mistral-vibe --skills tdd-workflow,security-review
```

Junior Dev writes each selected skill to `.vibe/skills/<name>/`. Vibe discovers this
directory natively for trusted projects and loads each `SKILL.md` through its
Agent Skills implementation. Junior Dev records only its managed files in
`.vibe/junior-dev-install-state.json`; an existing user-owned skill file is preserved.

## Verify and maintain the install

```bash
node "$JUNIOR_DEV_ROOT/scripts/list-installed.js" --target mistral-vibe
node "$JUNIOR_DEV_ROOT/scripts/doctor.js" --target mistral-vibe
node "$JUNIOR_DEV_ROOT/scripts/repair.js" --target mistral-vibe
node "$JUNIOR_DEV_ROOT/scripts/uninstall.js" --target mistral-vibe
```

Use `--dry-run --json` with install, repair, or uninstall to inspect changes
before writing them. Repair restores missing or drifted Junior Dev-managed skill files.
Uninstall removes unchanged managed files, but preserves modified files and the
install-state so they can be reviewed.

## Compatibility boundary

This first integration deliberately installs Agent Skills only. It does not
configure Vibe model/provider credentials, `.vibe/config.toml`, MCP servers, or
`.vibe/hooks.toml`. It also does not translate Junior Dev's Claude-oriented agent
Markdown into `.vibe/agents/*.toml`, and it does not claim that Junior Dev command or
rule directories are native Vibe surfaces.

Vibe also discovers project-level `.agents/skills/` and root `AGENTS.md`, but
Junior Dev uses `.vibe/skills/` so every managed write and lifecycle action stays
inside one project-local ownership boundary.

Official references:

- [Mistral Vibe](https://github.com/mistralai/mistral-vibe)
- [Agent Skills specification](https://agentskills.io/specification)
