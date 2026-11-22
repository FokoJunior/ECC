# Junior Dev for Hermes

This directory contains the Junior Dev configuration for the Hermes harness.

## What is installed

- `rules/junior-dev/` — shared coding rules and guidelines
- `skills/junior-dev/` — reusable skills
- `commands/` — slash commands
- `AGENTS.md` — agent instructions

## Manual install

```bash
bash ./install.sh --target hermes --profile minimal
```

## Notes

- Hermes config files (`config.yaml`, `.env`, etc.) are **not** touched by Junior Dev install.
- Use `npx junior-dev-universal doctor --target hermes` to check install health.
