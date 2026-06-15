# Angular smoke test

A minimal Angular 17 standalone app that imports `@studiolxd/scorm/angular`
(`provideScorm` + `inject(SCORM)`) and compiles in **AOT/production**. It proves the
decorator-free adapter is consumable from a plain-ESM (tsup) build — no ng-packagr /
Angular Package Format required. See `docs/PLAN-agnostic-core.md` §5/§11.

This project is **outside** the npm workspaces on purpose, so its Angular toolchain
doesn't interfere with the library install.

## Run locally

```bash
# from the repo root
npm run build --workspace=packages/scorm
npm pack --workspace=packages/scorm --pack-destination tests/angular-smoke

cd tests/angular-smoke
npm install
npm install ./studiolxd-scorm-*.tgz
npx ng build --configuration production
```

A successful `ng build` is the pass condition. CI runs the same steps
(`.github/workflows/angular-smoke.yml`) against Angular 17 (the documented floor).
