#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const { listAvailableLanguages } = require('./lib/install-executor');
const { getComputeSponsorCopy } = require('./lib/compute-sponsor');
const { createSafeItoInvocationEnvironment, getInvocationCommand } = require('./lib/ito-environment');

const COMMANDS = {
  setup: {
    script: 'setup.js',
    description: 'Install or update the Claude plugin with guided scope and hook choices',
  },
  welcome: {
    script: 'welcome.js',
    description: 'Show the Junior Dev welcome artwork and community links',
  },
  install: {
    script: 'install-apply.js',
    description: 'Install Junior Dev content, including the guided multi-harness wizard',
  },
  plan: {
    script: 'install-plan.js',
    description: 'Inspect selective-install manifests and resolved plans',
  },
  catalog: {
    script: 'catalog.js',
    description: 'Discover install profiles and component IDs',
  },
  consult: {
    script: 'consult.js',
    description: 'Recommend Junior Dev components and profiles from a natural language query',
  },
  profile: {
    script: 'profile.js',
    description: 'Inspect Lean/Full profiles, stage managed generations, and resolve task context',
  },
  'control-pane': {
    script: 'control-pane.js',
    description: 'Run the local Junior Dev 2 operator control pane',
  },
  ito: {
    script: 'ito.js',
    description: 'Invoke the separately installed canonical Itô compute CLI',
  },
  nasiko: {
    script: 'nasiko.js',
    description: 'Install or inspect the optional pinned Nasiko CLI lifecycle bridge',
  },
  memory: {
    script: 'memory.js',
    description: 'Share durable context across Claude, Codex, Hermes, and other harnesses',
  },
  'install-plan': {
    script: 'install-plan.js',
    description: 'Alias for plan',
  },
  'list-installed': {
    script: 'list-installed.js',
    description: 'Inspect install-state files for the current context',
  },
  doctor: {
    script: 'doctor.js',
    description: 'Diagnose missing or drifted Junior Dev-managed files',
  },
  feedback: {
    script: 'feedback.js',
    description: 'Open the shortest path to report a problem, feedback, or an idea',
  },
  repair: {
    script: 'repair.js',
    description: 'Restore drifted or missing Junior Dev-managed files',
  },
  'auto-update': {
    script: 'auto-update.js',
    description: 'Pull latest Junior Dev changes and reinstall the current managed targets',
  },
  status: {
    script: 'status.js',
    description: 'Query the Junior Dev SQLite state store status summary',
  },
  'platform-audit': {
    script: 'platform-audit.js',
    description: 'Audit GitHub queues, discussions, roadmap, release, and security evidence',
  },
  'security-ioc-scan': {
    script: 'ci/scan-supply-chain-iocs.js',
    description: 'Scan dependency and AI-tool persistence surfaces for active supply-chain IOCs',
  },
  sessions: {
    script: 'sessions-cli.js',
    description: 'List or inspect Junior Dev sessions from the SQLite state store',
  },
  'work-items': {
    script: 'work-items.js',
    description: 'Track linked Linear, GitHub, handoff, and manual work items',
  },
  'session-inspect': {
    script: 'session-inspect.js',
    description: 'Emit canonical Junior Dev session snapshots from dmux or Claude history targets',
  },
  'loop-status': {
    script: 'loop-status.js',
    description: 'Inspect Claude transcripts for stale loop wakeups and pending tool results',
  },
  uninstall: {
    script: 'uninstall.js',
    description: 'Remove Junior Dev-managed files recorded in install-state',
  },
};

const PRIMARY_COMMANDS = [
  'setup',
  'welcome',
  'install',
  'plan',
  'catalog',
  'consult',
  'profile',
  'control-pane',
  'ito',
  'nasiko',
  'memory',
  'list-installed',
  'doctor',
  'feedback',
  'repair',
  'auto-update',
  'status',
  'platform-audit',
  'security-ioc-scan',
  'sessions',
  'work-items',
  'session-inspect',
  'loop-status',
  'uninstall',
];

function showHelp(exitCode = 0) {
  process.stdout.write(`
Junior Dev selective-install CLI

Usage:
  junior-dev <command> [args...]
  junior-dev [install args...]
  junior-dev --dry-run <command> [args...]

Commands:
${PRIMARY_COMMANDS.map(command => `  ${command.padEnd(15)} ${COMMANDS[command].description}`).join('\n')}

Compatibility:
  junior-dev-install        Legacy install entrypoint retained for existing flows
  junior-dev [args...]      Without a command, args are routed to "install"
  junior-dev help <command> Show help for a specific command

Global Flags:
  --dry-run          Preview actions without executing (sets JUNIOR_DEV_DRY_RUN=1)

Compute:
  ${getComputeSponsorCopy()}

Examples:
  junior-dev setup
  junior-dev setup --mode claude-plugin --scope user --hooks standard --yes
  junior-dev welcome
  junior-dev install --guided
  junior-dev install --guided --harness claude --harness codex --harness kimi
  junior-dev typescript
  junior-dev install --profile developer --target claude
  junior-dev plan --profile core --target cursor
  junior-dev catalog profiles
  junior-dev catalog components --family language
  junior-dev catalog show framework:nextjs
  junior-dev consult "security reviews"
  junior-dev profile preview lean@1 --target codex --selection auto --json
  junior-dev control-pane --port 8765
  junior-dev ito login [--no-browser]
  junior-dev ito logout
  junior-dev ito auth
  junior-dev ito find --gpu h200 --count 8 --nodes 1 --gpus-per-node 8 --days 30 --storage-tb 1 --start-window 2099-08-15 --max-rate 3.00 --form-factor bare_metal --contract-type reservation --fabric infiniband --region us-east-1
  junior-dev ito status --json
  junior-dev nasiko status --json
  junior-dev nasiko install --version v0.1.0 --dry-run --json
  junior-dev nasiko install --version v0.1.0 --yes --json
  junior-dev ito evals --cluster clu_prod_example --live-sixtytwo --nodes gpu-01,gpu-02 --config-dir /absolute/path/to/qualification-config
  junior-dev memory init
  junior-dev memory handoff --from codex --target claude --title "Continue migration" --stdin
  junior-dev memory search "migration blockers" --target-harness hermes
  junior-dev list-installed --json
  junior-dev doctor --target cursor
  junior-dev feedback
  junior-dev repair --dry-run
  junior-dev auto-update --dry-run
  junior-dev status --json
  junior-dev status --exit-code
  junior-dev status --markdown --write status.md
  junior-dev platform-audit --json --allow-untracked docs/drafts/
  junior-dev security-ioc-scan --home
  junior-dev sessions
  junior-dev sessions session-active --json
  junior-dev work-items upsert linear-junior-dev-20 --source linear --source-id JUNIOR-DEV-20 --title "Review control-plane contract" --status blocked
  junior-dev work-items sync-github --repo junior-dev/junior-dev
  junior-dev session-inspect claude:latest
  junior-dev loop-status --json
  junior-dev uninstall --target antigravity --dry-run
`);

  process.exit(exitCode);
}

function resolveCommand(argv) {
  const args = argv.slice(2);

  if (args.length === 0) {
    return { mode: 'help' };
  }

  if (args.includes('--dry-run')) {
    process.env.JUNIOR_DEV_DRY_RUN = '1';
  }

  let cmdStart = 0;
  while (cmdStart < args.length && args[cmdStart] === '--dry-run') {
    cmdStart++;
  }

  if (cmdStart >= args.length) {
    return { mode: 'help' };
  }

  const firstArg = args[cmdStart];
  const restArgs = args.slice(cmdStart + 1);

  if (firstArg === '--help' || firstArg === '-h') {
    return { mode: 'help' };
  }

  if (firstArg === 'help') {
    return {
      mode: 'help-command',
      command: restArgs[0] || null,
    };
  }

  if (COMMANDS[firstArg]) {
    return {
      mode: 'command',
      command: firstArg,
      args: restArgs,
    };
  }

  const knownLegacyLanguages = listAvailableLanguages();
  const shouldTreatAsImplicitInstall = (
    firstArg.startsWith('-')
    || knownLegacyLanguages.includes(firstArg)
  );

  if (!shouldTreatAsImplicitInstall) {
    throw new Error(`Unknown command: ${firstArg}`);
  }

  return {
    mode: 'command',
    command: 'install',
    args,
  };
}

function runCommand(commandName, args) {
  const command = COMMANDS[commandName];
  if (!command) {
    throw new Error(`Unknown command: ${commandName}`);
  }
  const isItoLogin = commandName === 'ito' && getInvocationCommand(args) === 'login';
  const isProfileStart = commandName === 'profile' && getInvocationCommand(args) === 'start';
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, command.script), ...args],
    {
      cwd: process.cwd(),
      env: commandName === 'ito'
        ? {
          ...createSafeItoInvocationEnvironment(process.env, args, {
            includeControls: true,
          }),
        }
        : process.env,
      stdio: isItoLogin || isProfileStart || commandName === 'setup' || commandName === 'install'
        ? 'inherit'
        : commandName === 'memory' || commandName === 'profile'
          ? ['inherit', 'pipe', 'pipe']
          : ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (typeof result.status === 'number') {
    return result.status;
  }

  if (result.signal) {
    throw new Error(`Command "${commandName}" terminated by signal ${result.signal}`);
  }

  return 1;
}

function main() {
  try {
    const resolution = resolveCommand(process.argv);

    if (resolution.mode === 'help') {
      showHelp(0);
    }

    if (resolution.mode === 'help-command') {
      if (!resolution.command) {
        showHelp(0);
      }

      if (!COMMANDS[resolution.command]) {
        throw new Error(`Unknown command: ${resolution.command}`);
      }

      process.exitCode = runCommand(resolution.command, ['--help']);
      return;
    }

    process.exitCode = runCommand(resolution.command, resolution.args);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
