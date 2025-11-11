# Publishing Guide

This guide explains how to publish the JoyBoy packages to npm.

## Prerequisites

1. **npm Account**: Make sure you have an npm account. Sign up at https://www.npmjs.com/signup

2. **Login to npm**: 
   ```bash
   npm login
   ```

3. **Verify Login**:
   ```bash
   npm whoami
   ```

## Packages to Publish

The following packages are ready for publishing:

1. **@joyboy/types** - Type definitions
2. **@joyboy/core** - Core SDK and runtime  
3. **@joyboy/source-template** - CLI tool for creating new sources

> **Note**: Do NOT publish `@joyboy/source-registry` and `@joyboy/source-mangadex` yet as you mentioned they're still in development.

## Publishing Order

**Important**: Packages must be published in dependency order!

### Step 1: Publish @joyboy/types (no dependencies)

```bash
cd packages/types
npm publish --access public
```

### Step 2: Publish @joyboy/core (depends on @joyboy/types)

```bash
cd ../core
npm publish --access public
```

### Step 3: Publish @joyboy/source-template (no dependencies)

```bash
cd ../source-template
npm publish --access public
```

## Verification

After publishing, verify each package:

```bash
# Check if packages are public
npm view @joyboy/types
npm view @joyboy/core  
npm view @joyboy/source-template

# Test installation
npm install @joyboy/types
npm install @joyboy/core
npx @joyboy/source-template
```

## Alternative: Publish All at Once

If you want to publish all packages at once from the root:

```bash
# From project root
pnpm -w build

# Publish types first
cd packages/types && npm publish --access public && cd ../..

# Then core
cd packages/core && npm publish --access public && cd ../..

# Finally template
cd packages/source-template && npm publish --access public && cd ../..
```

## Troubleshooting

### Issue: "You do not have permission to publish"

Make sure you're logged in:
```bash
npm whoami
npm login
```

### Issue: "Package name already exists"

The package name `@joyboy/...` might be taken. You may need to:
1. Use a different scope (e.g., `@alaric-senpai/...`)
2. Or claim the `@joyboy` scope if it's available

### Issue: "402 Payment Required"

Scoped packages (`@scope/package`) are private by default. Use `--access public`:
```bash
npm publish --access public
```

## Future Publishing

For subsequent versions:

1. Update version in `package.json`:
   ```json
   {
     "version": "1.0.1"
   }
   ```

2. Rebuild:
   ```bash
   pnpm -w build
   ```

3. Publish:
   ```bash
   npm publish --access public
   ```

## Using Changesets (Optional)

The project has `@changesets/cli` set up for automated versioning:

```bash
# Create a changeset
pnpm changeset

# Version packages
pnpm version

# Build and publish
pnpm release
```

## Post-Publishing Checklist

- [ ] Verify packages appear on npmjs.com
- [ ] Test installing in a fresh project
- [ ] Update main README with installation instructions
- [ ] Add npm badges to README
- [ ] Tag the release in Git:
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

## Package URLs

After publishing, your packages will be available at:

- https://www.npmjs.com/package/@joyboy/types
- https://www.npmjs.com/package/@joyboy/core
- https://www.npmjs.com/package/@joyboy/source-template

## Quick Reference

```bash
# Build everything
pnpm -w build

# Publish types
cd packages/types && npm publish --access public

# Publish core  
cd packages/core && npm publish --access public

# Publish template
cd packages/source-template && npm publish --access public
```
