import { defineConfig } from 'tsup';

// Framework deps are never bundled — they are optional peer dependencies.
const external = ['react', 'react-dom', 'vue', '@angular/core', 'svelte'];

export default defineConfig([
  // ── ESM + CJS library, one entry per subpath ──────────────────────────────
  {
    entry: {
      index: 'src/index.ts',
      react: 'src/react/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    external,
  },
  // ── IIFE / global build for <script> usage (window.Scorm) ─────────────────
  // Core only (no framework deps) — for plain HTML / CDN.
  {
    entry: { scorm: 'src/index.ts' },
    format: ['iife'],
    globalName: 'Scorm',
    sourcemap: true,
    minify: true,
    treeshake: true,
    clean: false,
  },
]);
