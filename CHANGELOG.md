# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-17

### Added

#### @joyboy-parser/core
- **Dynamic ES Module Loading**: Added support for loading transpiled/bundled sources with proper import resolution
- **Automatic GitHub URL Conversion**: Automatically detects and converts GitHub tree URLs to raw.githubusercontent.com URLs
- **Enhanced Validation**: Added detailed error messages for validation failures
- **HTML Detection**: Added validation to detect when HTML is downloaded instead of JavaScript
- **Transpiled Code Support**: Updated validation regex to recognize both standard and transpiled code patterns:
  - Supports `var/const/let X = class extends BaseSource` syntax
  - Supports `export { X as default }` syntax
- **Temporary File Cleanup**: Proper cleanup of temporary files after dynamic module loading
- **Import Path Rewriting**: Automatic rewriting of `@joyboy-parser/core` and `@joyboy-parser/types` imports for dynamic loading

#### @joyboy-parser/source-registry
- Updated registry with correct jsDelivr CDN URLs for source downloads
- Updated SHA-256 integrity hashes for all sources

#### @joyboy-parser/source-mangadex
- Updated source metadata with jsDelivr CDN URLs
- Correct SHA-256 hash: `bc33822547b8ff31d444d6b0b5073f0dcb8be9a354d0c4be80ecf6cf2c46bac6`

### Fixed

#### @joyboy-parser/core
- **GitHub Tree URL Issue**: Fixed sources downloading HTML pages instead of JavaScript files when using GitHub tree URLs
- **Code Validation**: Fixed validation regex to properly recognize transpiled/bundled code patterns
- **Module Loading**: Fixed ES module loading to work with dynamic imports and package resolution
- **Error Messages**: Improved error messages with detailed context for troubleshooting

### Changed

#### @joyboy-parser/core
- `validateSourceCode()` now throws descriptive errors instead of returning boolean
- Enhanced security validation with named dangerous patterns
- Improved download error messages with URL context

### Technical Details

#### Module Loading Architecture
The core package now uses a sophisticated temporary file approach for loading sources:
1. Downloads source code from CDN
2. Verifies SHA-256 integrity
3. Validates code structure (class inheritance, exports, security)
4. Creates temporary `.mjs` file with rewritten imports
5. Dynamically imports using Node.js `import()`
6. Instantiates source class
7. Cleans up temporary file

#### Supported Code Patterns

**Class Declaration:**
- Standard: `class MangaDexSource extends BaseSource`
- Transpiled: `var MangaDexSource = class extends BaseSource`
- Transpiled: `const MangaDexSource = class extends BaseSource`
- Transpiled: `let MangaDexSource = class extends BaseSource`

**Exports:**
- Standard: `export default MangaDexSource`
- Transpiled: `export { MangaDexSource as default }`
- CommonJS: `module.exports = MangaDexSource`

#### Security Validation
The following patterns are blocked for security:
- `eval()`
- `new Function()`
- `require('child_process')`
- `require('fs')`
- `require('net')`
- `require('http')`

### Migration Guide

If you have existing sources, ensure:
1. Download URLs use raw file URLs (raw.githubusercontent.com or jsDelivr CDN)
2. SHA-256 hashes match the actual file content
3. Source code extends `BaseSource` and has a default export

The core package will automatically:
- Convert GitHub tree URLs to raw URLs (with warning)
- Detect HTML downloads and provide clear error messages
- Support both transpiled and non-transpiled code

### Breaking Changes

None. This release is backward compatible with 1.0.x sources.

---

## [1.0.3] - 2025-11-16

### Initial Release
- Core SDK with source loading capabilities
- Source registry with dynamic catalog
- Type definitions
- MangaDex source implementation
