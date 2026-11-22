# Companion skills for task context selection

## Problem

Junior Dev's task-context resolver ranks only Junior Dev's own skills. Most users also have
skills from other plugins, from their own `skills/` folder, or from another
tool. A task often fits an Junior Dev skill and one of those other skills at the same
time: a slow Postgres query fits Junior Dev's `postgres-patterns` and the user's own
database review skill, which may carry the team's conventions. Today the
resolver and the opt-in suggestion hook say nothing about the second skill.

The resolver runs through `junior-dev profile resolve` and `junior-dev profile run`. The
opt-in prompt suggestion hook (`scripts/hooks/context-prompt-suggestions.js`)
uses the same retrieval engine to suggest up to three skills.

## Rule

Junior Dev's own decision does not change. Installed non-Junior Dev skills (*neighbors*) that
also match the task are listed next to it as **companions**, so the host can
use Junior Dev's skill and the user's skills together.

- **Scoring.** Each neighbor is scored with the Junior Dev index's own BM25 statistics
  (IDF and average length), the same tokenizer, field weights and
  query-coverage floor, shaped like an Junior Dev entry whose id slug is its name.
  Junior Dev's candidates and scores are computed exactly as before.
- **Bar.** A neighbor is listed when it clears the score part of the
  automatic-load bar (BM25 at least `AUTO_ADMIT_MIN_BM25`, at least
  `AUTO_ADMIT_MIN_TERMS` matched terms) and either:
  - **anchored:** at least `MIN_ANCHOR_TERMS` matched term is in its name
    (neighbors have no curated triggers, so the check reads the name only); or
  - **clear leader:** it is the highest-scoring neighbor and scores at least
    `AUTO_ADMIT_MARGIN` times the next neighbor. Skills written for one team's
    codebase often have names a prompt never uses ("billing-runbook" for "why
    did the invoice job roll back"), so the anchor alone hid most of them. The
    margin keeps this route to one clear winner.

  No constant changes and none is added.
- **Copies.** Copies of one skill (same name and description) from several
  sources are listed once, with the other sources in `alsoIn`.
- **Same topic.** A companion is marked `sameTopicAs` Junior Dev's top candidate when
  one of its matched terms is an anchor term (name or trigger) of that
  candidate. The text says it "may hold your own conventions"; Junior Dev does not
  decide which skill's conventions win.
- **Never loaded.** Junior Dev does not load, read or vouch for a companion. It lists
  the name, source, description and score only.
- **Every mode.** Companions are listed with explicit IDs, proposals, cited
  skills, manual mode, reuse and no-workflow tasks, since they never change
  what Junior Dev loads.

## Where companions appear

- **Resolver result.** With a non-empty neighbor list the result gains
  `neighborsDigest` and `companions` (up to `MAX_CANDIDATES`), and one
  limitation line. Selected ids, candidates, fallback, reason and receipt are
  unchanged; companions are not part of the binding or the receipt and are
  recomputed on every resolve.
- **Launched session.** `junior-dev profile run` appends one block after Junior Dev's context
  that names each companion with its source and a description capped at 200
  characters, so the launched session can invoke it. A bare launch has no Junior Dev
  context and no companions.
- **Suggestion hook.** With `JUNIOR_DEV_CONTEXT_NEIGHBORS` set, the hook prints Junior Dev's
  suggestions unchanged, then up to three companions. It prints companions on
  their own when Junior Dev has no suggestion. Junior Dev's suggestions are computed and
  budget-checked first; a missing, unreadable or invalid snapshot, or a spent
  budget, drops only the companions (with a stderr note), never Junior Dev's block.

Names and descriptions come from other skills' files, so they are printed as
JSON-quoted strings under a line that calls them data, not instructions.
Neighbor text with C0 or C1 control characters or invisible format characters
(zero-width, bidirectional and tag characters) is rejected; tabs and line
breaks are collapsed to spaces.

With no list, or an empty list, every output is byte-identical to before.

## Inputs and binding

Neighbors are an explicit input, never discovered during resolution, so the
same input gives the same result on every machine and CI does not depend on
what the runner has installed.

- `resolveTaskContext({ neighbors })` accepts an array of
  `{ source, name, description }` or an `junior-dev.context-neighbors.v1` snapshot.
  Lists are validated (at most 1024 entries; bounded strings; no unknown
  fields), canonically ordered, deduplicated and digested.
- `--neighbors` is rejected with `--native-root`: an isolated native generation
  does not contain the current home's other skills, so the session could not
  use them.

## Discovery

`junior-dev profile neighbors [--target codex|claude] [--json]` is read-only and
writes nothing. It returns a snapshot of the current provider home:

- **Claude:** `$CLAUDE_CONFIG_DIR` (default `~/.claude`) `skills/*/SKILL.md`,
  plus `skills/*/SKILL.md` of each user-scope plugin in
  `plugins/installed_plugins.json` that `settings.json` `enabledPlugins` marks
  `true`, plus the project's own `.claude/skills/*/SKILL.md` (source
  `claude:project`), where teams keep skills for their own codebase. The project
  is the current directory or `--project <directory>`; a snapshot therefore
  belongs to one project.
- **Codex:** `$CODEX_HOME` (default `~/.codex`) `skills/*/SKILL.md`.

Only frontmatter `name` and `description` are read (YAML core schema, bounded
file size). Junior Dev's own plugin (matched by its `.claude-plugin/plugin.json` name)
and installed copies of Junior Dev skills (same name and description as the registry)
are excluded and counted. Unreadable or incomplete skills are skipped and
counted.

Use the snapshot with `junior-dev profile resolve|run --neighbors <file>`, or set
`JUNIOR_DEV_CONTEXT_NEIGHBORS` to its absolute path for the suggestion hook.

## Non-goals

- Loading, invoking or reading the bodies of non-Junior Dev skills.
- Ranking or choosing between non-Junior Dev skills beyond listing the ones that clear
  the bar. The host decides what to use.
- Changing Junior Dev's own selection in any way.
- The default plugin install, where the host sees every skill at once and
  routes them itself. This change covers Junior Dev's resolver, launches and
  suggestions.
- Discovering project-scope plugins or host-specific skill folders beyond the
  ones listed above.

## Known limitations

- **Lexical only.** Neighbors are compared by BM25 over name and description.
  A query word no Junior Dev skill uses gets the full IDF when a neighbor contains it,
  so a companion can be listed on vocabulary alone.
- **Same-topic label is lexical.** It means a shared anchor word, not a shared
  purpose: "red, yellow or green" in a status report shares the TDD words of
  Junior Dev's `tdd-workflow`. When Junior Dev ranks no candidates (reuse, manual mode, a
  no-workflow task or a declined proposal) companions are listed without it.
- **The hook reads the snapshot on every prompt.** Resolution is deterministic
  for a given list, but the hook reads whatever file `JUNIOR_DEV_CONTEXT_NEIGHBORS`
  points to at that moment.
- **Recall is partial.** On the evaluation below the intended skill was listed
  for 68 to 76 percent of prompts written for it. Most of the rest score below
  the automatic-load bar; the lower fallback bar was rejected because it
  listed many unrelated skills.
- **Suggestion hook budget.** Reading and scoring a snapshot of 194 neighbors
  added 5 to 20 ms (median, two idle runs over 50 prompts; about 55 ms without
  neighbors) to the hook's work on the evaluation machine; the Junior Dev index is
  built once and shared. Junior Dev's suggestions are budget-checked
  before companions, so a slow companion pass drops only the companions. Raise
  `JUNIOR_DEV_CONTEXT_SUGGEST_BUDGET_MS` if they are dropped often.
- **Discovery is conservative.** Project-scope plugins, nested `.claude/skills`
  folders below the project root, Codex project skills, plugin-declared custom
  skill paths, skills synced into other app folders and older
  `installed_plugins.json` shapes are not read. A hand-written snapshot can
  list them.

## Evidence

Evaluated on one Windows machine with 194 installed non-Junior Dev skills (bundled
and marketplace plugins plus user skills). Two prompt sets of 194 prompts each,
one per outside skill, were written by a separate model run that saw only the
outside skills' names and descriptions, never Junior Dev's. Each rule was chosen on
set A and Junior Dev's own routing corpus, frozen, then run once on set B. Each
prompt was resolved exactly as the routing gate resolves (`selectionMode:
auto`, `load: false`, one fresh task each).

| Check | Junior Dev corpus | Set A (rule chosen here) | Set B (held out) |
| --- | --- | --- | --- |
| No neighbors: result byte-identical to before | 77 / 77 | 194 / 194 | 194 / 194 |
| 194 neighbors: Junior Dev fields byte-identical | 77 / 77 | 194 / 194 | 194 / 194 |
| Intended skill listed, anchored only | n/a | 85 | 75 |
| Intended skill listed, anchored or clear leader | n/a | 147 | 132 |
| Other skills listed, anchored only | 4 | 36 | 24 |
| Other skills listed, anchored or clear leader | 4 | 37 | 26 |

The clear-leader route was added after the anchored rule: on set A, 86 of the
109 prompts whose intended skill went unlisted failed only the name check.
Dropping the name check outright listed 171 on set A but raised other listings
from 36 to 126; allowing one unanchored leader without the margin listed 163
with 50 others. Listing counts above use the suggestion hook's limit of three.

"Junior Dev fields" means everything except `companions`, `neighborsDigest` and the
companion limitation line: selected ids, candidates and scores, fallback,
reason, receipt. Junior Dev's own loads on its corpus (17, all correct) are unchanged.
On that corpus 4 companions were listed, all on direct prompts:
`supabase-postgres-best-practices` next to `postgres-patterns`,
`accessibility-review`, `architecture` and `pr-comments`. Resolve time did not
change measurably (about 2.7 s per prompt either way, dominated by registry
loading).
The synthetic fixture `tests/fixtures/context-selection/neighbor-skills.json`
pins the behavior in CI against the shipped registry without any
machine-specific skills.
