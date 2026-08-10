# Consolidate into standalone app — drop library/app split

The ORD Explorer was originally structured as a publishable npm component library (`@open-resource-discovery/ord-explorer`) with a dual Vite build: `build:lib` for the npm package and `build:app` for a demo/standalone deployment. The `ORDExplorer` component accepted an `OrdDocument` as a prop; the host application was responsible for fetching it.

This model is dropped. The project becomes a single standalone application with no published npm deliverable.

## Reason

The authentication feature (feat-58) requires managing connection credentials, fetching ORD documents with auth, and running an mTLS proxy. None of these responsibilities belong in a passive rendering component. Implementing them inside a "host app provides fetch" contract would either push complexity onto every consumer or require the library to own side effects that violate the component library model.

No external npm consumer exists today. The library contract was aspirational. Preserving dual-build infrastructure for a hypothetical future consumer that hasn't materialised is architectural overhead that actively fights the feature being built.

## Consequences

- `build:lib`, `vite-plugin-dts`, `cssDts` plugin, and all lib-mode Rollup config are removed from `vite.config.ts`.
- `src/lib/index.ts` (the library entry point) is removed.
- `main`, `module`, `types`, `exports`, `files`, `peerDependencies`, and `sideEffects` fields are removed from `package.json`. The package is no longer publishable.
- `prepack` script is removed.
- The `ORDExplorer` component and everything under `app/src/` remain; only the library packaging infrastructure is deleted.
- The live demo URL referenced in the README (`open-resource-discovery.github.io/explorer`) remains valid — GH Pages deployment of the app continues unchanged.
- If a library extraction is needed in the future, it should be done as a deliberate extraction from the settled app, not by re-instating this infrastructure.
