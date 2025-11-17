# Manual Publishing Guide

## Prerequisites

1. Ensure you're logged into npm:
```bash
npm whoami
# Should show: alaric-senpai
```

If not logged in:
```bash
npm login
```

2. Ensure all packages are built:
```bash
cd /home/alaric-senpai/codeReporsitories/packages/joyboyProject
pnpm build
```

## Publishing Order

Publish in dependency order to avoid issues:

### 1. Publish Types (no dependencies)

```bash
cd packages/types
npm publish --access public
cd ../..
```

### 2. Publish Source Registry (depends on types)

```bash
cd packages/source-registry
npm publish --access public
cd ../..
```

### 3. Publish Core (depends on types and source-registry)

```bash
cd packages/core
npm publish --access public
cd ../..
```

### 4. Publish Source MangaDex (depends on core and types)

```bash
cd packages/sources/source-mangadex
npm publish --access public
cd ../..
```

## Verify Publication

Check on npm:
- https://www.npmjs.com/package/@joyboy-parser/types
- https://www.npmjs.com/package/@joyboy-parser/source-registry
- https://www.npmjs.com/package/@joyboy-parser/core
- https://www.npmjs.com/package/@joyboy-parser/source-mangadex

## One-Command Publish (if you prefer)

```bash
# From project root
cd packages/types && npm publish --access public && cd ../.. && \
cd packages/source-registry && npm publish --access public && cd ../.. && \
cd packages/core && npm publish --access public && cd ../.. && \
cd packages/sources/source-mangadex && npm publish --access public && cd ../..
```

## Versions Being Published

- `@joyboy-parser/types@1.1.0`
- `@joyboy-parser/source-registry@1.1.0`
- `@joyboy-parser/core@1.1.0`
- `@joyboy-parser/source-mangadex@1.0.2`

## After Publishing

Test the packages outside the monorepo following [EXTERNAL_TESTING.md](./EXTERNAL_TESTING.md)

## Troubleshooting

### "You do not have permission to publish"
- Make sure you're logged in as the package owner
- Check package name is available on npm
- Ensure `--access public` flag is used for scoped packages

### "Version already exists"
- Bump the version in package.json
- Rebuild: `pnpm build`
- Try publishing again

### "Package not found" errors during install
- Ensure packages are published in correct order (types → registry → core → sources)
- Wait a few minutes for npm CDN to propagate
