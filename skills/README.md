# scorm-skills

Agent instructions that teach AI coding tools how to use `@studiolxd/scorm`.

**One canonical source → many tool formats.** Everything in `build/` is generated;
edit only `source/skill.md`.

```
source/skill.md          # the single source of truth (edit this)
scripts/build.mjs        # generator: source → build/*
build/                   # generated (do not edit by hand)
  claude-plugin/         # Claude Code plugin + marketplace
    .claude-plugin/marketplace.json
    plugins/scorm-integration/...
  cursor/scorm-integration.mdc   # Cursor rule
  agents/scorm-integration.md    # portable baseline (Antigravity, Copilot, generic)
```

Regenerate after editing the source:

```bash
node skills/scripts/build.mjs
```

## Using it per tool

- **Claude Code** — add `skills/build/claude-plugin` as a plugin marketplace (its
  `.claude-plugin/marketplace.json`), then install the `scorm-integration` plugin.
  For distribution, publish `build/claude-plugin` as its own public repo.
- **Cursor** — copy `build/cursor/scorm-integration.mdc` into your project's
  `.cursor/rules/`.
- **Other agents (Antigravity, Copilot, …)** — drop `build/agents/scorm-integration.md`
  into the project (e.g. append to `AGENTS.md`), or point the tool's rules at it.

## Why this is separate from the npm package

The runtime package `@studiolxd/scorm` ships only `dist/` + `llms.txt` — it stays lean.
Agent skills target a different audience (coding-assistant toolchains) and are
distributed via marketplaces/rules, not `npm install`. Per the plan they live in a
dedicated location (here, intended to be published as `studiolxd/scorm-skills`).

> Note: marketplace/plugin manifest schemas evolve — verify `marketplace.json` and
> `plugin.json` against the current Claude Code plugin docs before publishing.
