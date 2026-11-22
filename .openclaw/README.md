# Junior Dev for OpenClaw

This directory contains the Junior Dev configuration for the OpenClaw harness.

## What is installed

- `rules/junior-dev/` — shared coding rules and guidelines
- `skills/junior-dev/` — reusable skills
- `commands/` — slash commands
- `AGENTS.md` — agent instructions

## Manual install

```bash
bash ./install.sh --target openclaw --profile minimal
```

## Notes

- OpenClaw config files (`openclaw.json`, `config.toml`, `.env`, etc.) are **not** touched by Junior Dev install.
- Use `npx junior-dev-universal doctor --target openclaw` to check install health.
