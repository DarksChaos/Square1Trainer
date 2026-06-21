# Unified Trainer

OBL and PBL trainers for Square-1.

## Development

```sh
npm install
npm run lint
npm run build
```

`npm run build` recreates `public/` with bundled, minified, and identifier-mangled ES modules. Algorithm-reference data is emitted as deferred chunks and loaded after the initial UI paint.

Live site: https://squan-trainers.web.app/
