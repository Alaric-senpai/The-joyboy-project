# Contributing

Thank you for contributing! Please follow these steps:

1. Implement parser logic in `src/index.ts`.
2. Run tests: `pnpm test`.
3. Build: `pnpm build` and verify `dist` contains compiled files and types.
4. Update `source-meta.json` with correct metadata and integrity hashes.
5. Validate metadata: `pnpm run validate-meta`.
