const fs = require("node:fs")
const path = require("node:path")

/**
 * Same placeholder set Pi's `substituteArgs` understands.
 *
 * Pi expands every form below, so a command body containing any of them must
 * be left for Pi to expand rather than treated as placeholder-less:
 *   $ARGUMENTS, $@, $1, ${1:-default}, ${@:N}, ${@:N:L}
 */
const ARG_PLACEHOLDER = /\$\{(\d+|ARGUMENTS|@):-[^}]*\}|\$\{@:\d+(?::\d+)?\}|\$(ARGUMENTS|@|\d+)/

/** Values Junior Dev treats as "off" across its existing environment switches. */
const DISABLED_VALUES = new Set(["0", "false", "off", "none", "disabled"])

function isDisabledByEnv(value) {
  return typeof value === "string" && DISABLED_VALUES.has(value.trim().toLowerCase())
}

function stripFrontmatter(raw) {
  return raw.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim()
}

/**
 * Body of an Junior Dev command that has NO argument placeholder, or null.
 *
 * Claude Code appends `ARGUMENTS: <args>` when a command lacks `$ARGUMENTS`;
 * Pi's template expansion silently drops the arguments instead. Most Junior Dev
 * commands rely on the Claude behaviour, so the adapter restores it.
 */
function loadPlaceholderlessCommand(name, juniorDevRoot, commandPath, reportReadError = message => console.warn(message)) {
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    return null
  }

  const resolvedPath = commandPath || path.join(juniorDevRoot, "commands", `${name}.md`)
  try {
    const raw = fs.readFileSync(resolvedPath, "utf8")
    const stripped = stripFrontmatter(raw)
    return ARG_PLACEHOLDER.test(stripped) ? null : stripped
  } catch (error) {
    const detail = error && error.message ? error.message : String(error)
    reportReadError(`[junior-dev-pi] unable to read command ${resolvedPath}: ${detail}`)
    return null
  }
}

/**
 * Returns the canonical Junior Dev command path only when Pi's active prompt for
 * `name` resolves to Junior Dev's canonical `commands/<name>.md`.
 *
 * The input event fires before Pi expands prompt templates and does not expose
 * the selected template directly. `pi.getCommands()` does expose the active
 * prompt list (including source metadata), so this is the provenance check
 * that keeps Junior Dev from overriding a disabled, differently resolved, or
 * extension-registered command with the same name.
 */
function activeJuniorDevPromptPath(name, juniorDevRoot, activeCommands) {
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    return null
  }

  const activePrompt = (activeCommands || []).find(
    command => command && command.name === name && command.source === "prompt"
  )
  if (!activePrompt || !activePrompt.sourceInfo) {
    return null
  }

  const expectedPath = path.resolve(path.join(juniorDevRoot, "commands", `${name}.md`))
  if (path.resolve(activePrompt.sourceInfo.path || "") !== expectedPath) {
    return null
  }
  return expectedPath
}

/**
 * Pi input-handler transform shared by the TypeScript extension and tests.
 *
 * Keep this in a CommonJS module so the real registered handler can be loaded
 * and exercised by the plain Node test suite; the extension itself delegates
 * directly to this function.
 */
function handlePiInput({ text, juniorDevRoot, env, activeCommands, getBody }) {
  if (isDisabledByEnv(env.JUNIOR_DEV_PI_COMMAND_ARGS)) {
    return { action: "continue" }
  }

  const match = text.match(/^\/([^\s:]+)\s+([\s\S]*\S[\s\S]*)$/)
  if (!match) {
    return { action: "continue" }
  }

  const commandPath = activeJuniorDevPromptPath(match[1], juniorDevRoot, activeCommands)
  if (!commandPath) {
    return { action: "continue" }
  }

  const body = getBody
    ? getBody(match[1], commandPath)
    : loadPlaceholderlessCommand(match[1], juniorDevRoot, commandPath)
  if (!body) {
    return { action: "continue" }
  }

  return { action: "transform", text: `${body}\n\nARGUMENTS: ${match[2].trim()}` }
}

/**
 * The real Pi input-event callback the TypeScript extension registers.
 *
 * Extracted here (rather than being an anonymous arrow in index.ts) so the
 * plain Node test suite can invoke the exact registered handler with a fake
 * `pi` object and assert both its guard branches and its transform result.
 */
function handlePiInputEvent(event, pi, options) {
  if (
    !event ||
    event.source === "extension" ||
    event.streamingBehavior === "steer" ||
    typeof pi.getCommands !== "function"
  ) {
    return { action: "continue" }
  }

  return handlePiInput({
    text: event.text,
    juniorDevRoot: options.juniorDevRoot,
    env: options.env,
    activeCommands: pi.getCommands(),
    getBody: options.getBody,
  })
}

/**
 * Creates a body reader with its own cache.
 *
 * The returned function returns a fresh Map on each new lookup rather than
 * mutating the previous cache, satisfying Junior Dev's immutability rule.
 */
function createCommandBodyReader(juniorDevRoot, reportReadError) {
  let cache = new Map()
  return name => {
    if (cache.has(name)) {
      return cache.get(name) ?? null
    }
    const body = loadPlaceholderlessCommand(name, juniorDevRoot, undefined, reportReadError)
    cache = new Map(cache).set(name, body)
    return body
  }
}

module.exports = {
  ARG_PLACEHOLDER,
  DISABLED_VALUES,
  isDisabledByEnv,
  stripFrontmatter,
  loadPlaceholderlessCommand,
  createCommandBodyReader,
  activeJuniorDevPromptPath,
  handlePiInput,
  handlePiInputEvent,
}
