
# @joyboy-parser/source-registry

Dynamic source registry and catalog for JoyBoy parsers.

## Installation
# @joyboy-parser/source-registry

Dynamic source registry and catalog for JoyBoy parsers.

This package provides a central catalog of available parser packages (sources) for the JoyBoy ecosystem. It offers programmatic discovery, search, filtering, statistics, and optional synchronization with a remote GitHub-backed registry.

Install
-------

Install from npm:

```bash
npm install @joyboy-parser/source-registry
# or with pnpm
pnpm add @joyboy-parser/source-registry
```

Quick start (Node / ESM)
------------------------

```ts
import {
  getAllSources,
  getSourceById,
  searchSources,
  sourceCatalog,
  SourceCatalog
} from '@joyboy-parser/source-registry';

// Get all bundled sources
const all = getAllSources();

// Search
const results = searchSources('manga');

// Use the singleton catalog
const stats = sourceCatalog.getStatistics();
console.log(`Total sources: ${stats.totalSources}`);

// Create a catalog that syncs with a remote registry
const remoteCatalog = new SourceCatalog('https://raw.githubusercontent.com/yourorg/yourrepo/main/registry/sources.json');
await remoteCatalog.syncWithRemote();
```

API Overview
------------

Exports (most useful):

- `getAllSources(): RegistryEntry[]` — return all registered sources.
- `getSourceById(id: string): RegistryEntry | undefined` — lookup by ID.
- `searchSources(query: string): RegistryEntry[]` — fuzzy search across id/name/description/tags.
- `getSourcesByLanguage(lang: string): RegistryEntry[]` — filter by language code (e.g., `en`, `ja`).
- `getOfficialSources()` / `getCommunitySources()` — split by official flag.
- `getSFWSources()` / `getNSFWSources()` — filter by NSFW flag.
- `getStatistics(): RegistryStats` — registry-level counts and distributions.
- `SourceCatalog` — class with the above instance methods plus `registerSource`, `unregisterSource`, `syncWithRemote()`.

Remote sync
-----------

The package optionally supports syncing with a remote registry JSON (for example a GitHub raw file or a CDN). Construct `new SourceCatalog(remoteUrl)` and call `syncWithRemote()` to fetch and merge remote entries. The remote registry should be an array of `RegistryEntry` objects (see `sources.json` for the bundled format).

Bundled data
------------

This package includes a `sources.json` file containing the bundled list of known sources. The `update-registry` script (if present) can be used during development to regenerate the list from the workspace.

Contributing
------------

If you maintain a source package and want it listed in the registry:

1. Open a PR adding or updating the entry in `packages/source-registry/sources.json`.
2. Follow the `RegistryEntry` shape (id, name, packageName, baseUrl, description, languages, tags, repository, installCommand, lastUpdated, official, etc.).

If you want automatic publishing of the registry from a GitHub repo, add a workflow to update `sources.json` and publish to the raw CDN.

Notes & runtime
---------------

- The package is ESM and targets modern Node.js runtimes. If you use it in older runtimes, ensure you have appropriate compatibility shims.
- When using a remote registry, network failures fall back to the bundled data — `syncWithRemote()` attempts to fail gracefully.

License
-------

MIT

---

If you want any additional sections (badges, example registry JSON, or a CLI reference for `scripts/update-registry.js`), tell me what to include and I’ll update the README accordingly.
