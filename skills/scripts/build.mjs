#!/usr/bin/env node
// Generate per-tool skill files from the single canonical source (source/skill.md).
// One source → Claude Code plugin/marketplace, Cursor rule, and a portable baseline.
// Run: node skills/scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const raw = readFileSync(resolve(root, 'source/skill.md'), 'utf8');

// Split YAML frontmatter (--- ... ---) from the markdown body.
const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!m) throw new Error('source/skill.md is missing frontmatter');
const [, fm, body] = m;

const field = (key) => {
  const line = fm.split('\n').find((l) => l.startsWith(`${key}:`));
  return line ? line.slice(key.length + 1).trim() : '';
};
const name = field('name');
const description = field('description');
const globs = field('globs'); // JSON-ish array literal
const VERSION = '1.0.0';

const write = (rel, content) => {
  const out = resolve(root, 'build', rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, typeof content === 'string' ? content.trimStart() : JSON.stringify(content, null, 2) + '\n');
  console.log('wrote', `build/${rel}`);
};

// 1. Claude Code plugin + marketplace.
//    Add this repo's build/claude-plugin as a marketplace, then install the plugin.
write('claude-plugin/.claude-plugin/marketplace.json', {
  name: 'studiolxd-scorm',
  owner: { name: 'StudioLXD', url: 'https://github.com/studiolxd' },
  plugins: [{ name, source: `./plugins/${name}`, description, version: VERSION }],
});
write(`claude-plugin/plugins/${name}/.claude-plugin/plugin.json`, {
  name,
  description,
  version: VERSION,
});
write(`claude-plugin/plugins/${name}/skills/${name}/SKILL.md`, `---
name: ${name}
description: ${description}
---

${body.trim()}
`);

// 2. Cursor rule — .mdc with description + globs + alwaysApply.
write(`cursor/${name}.mdc`, `---
description: ${description}
globs: ${globs}
alwaysApply: false
---

${body.trim()}
`);

// 3. Portable AGENTS-style baseline (Antigravity, Copilot, generic).
write(`agents/${name}.md`, `# ${name}

${body.trim()}
`);

console.log('\nDone. One source → Claude plugin, Cursor rule, portable baseline.');
