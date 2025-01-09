# Noir and UltraHonk benchmarks

This web app provides benchmarks for the UltraHonk prover in the browser on various Noir circuits.

This repo was adapted from
[this](https://noir-lang.org/docs/tutorials/noirjs_app) Noir docs page. It has
been modified to work with Nargo version 1.0.0-beta.0. `package.json` has been
modified to use `@aztec/bb.js` 0.63.1 instead of
`@noir-lang/backend_barretenberg`. It also uses `UltraHonkBackend` instead of
`BarretenbergBackend` (see `main.js`).

## Noir project

Uses `nargo` version 1.0.0-beta.0

Recompile with

```bash
nargo compile
```

## Vite project

```bash
cd web
```

Install dependencies with

```bash
npm install
```

Run the app with:

```bash
npm run dev
```
