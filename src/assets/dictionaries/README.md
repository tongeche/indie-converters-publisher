`en.aff` / `en.dic` are the Hunspell dictionary files from the [`dictionary-en`](https://www.npmjs.com/package/dictionary-en) npm package (v4.0.0, MIT/BSD), vendored here directly because that package's `exports` field only exposes its JS loader (which reads files via `node:fs` and doesn't run in a browser) — not the `.aff`/`.dic` files themselves.

To update: `npm view dictionary-en version`, then copy `index.aff` → `en.aff` and `index.dic` → `en.dic` from a fresh install of that package.
