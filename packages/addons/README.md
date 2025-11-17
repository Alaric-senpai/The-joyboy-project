# @joyboy-parser/addons

Extension system and addons for the JoyBoy parser ecosystem. This package provides a plugin architecture, lifecycle hooks, and middleware capabilities for extending source parsers.

## Features

- **Plugin System**: Modular plugin architecture for extending functionality
- **Lifecycle Hooks**: Hook into various stages of the parsing pipeline
- **Middleware**: Request/response interceptors for custom logic
- **Built-in Utilities**: Retry, rate limiting, logging, and caching middleware

## Installation

```bash
npm install @joyboy-parser/addons
# or
pnpm add @joyboy-parser/addons
# or
yarn add @joyboy-parser/addons
```

## Quick Start

### Using Plugins

```typescript
import { createPluginManager, createPlugin } from '@joyboy-parser/addons';

// Create a plugin manager
const pluginManager = createPluginManager();

// Create a simple plugin
const myPlugin = createPlugin({
	name: 'my-plugin',
	version: '1.0.0',
	description: 'A simple example plugin',
	install: (manager) => {
		// Register hooks
		manager.registerHook('beforeRequest', async (context) => {
			console.log('Making request to:', context.url);
			return context;
		});

		// Register middleware
		manager.registerMiddleware(async (context, next) => {
			console.log('Middleware executed');
			return next();
		});
	}
});

// Use the plugin
await pluginManager.use(myPlugin);
```

### Using Hooks

```typescript
import { createHookManager } from '@joyboy-parser/addons';

const hooks = createHookManager();

// Register a hook callback
hooks.register('beforeRequest', async (context) => {
	// Add custom headers
	context.headers = {
		...context.headers,
		'User-Agent': 'MyCustomAgent/1.0'
	};
	return context;
});

// Execute hooks
const context = { url: 'https://example.com', headers: {} };
const result = await hooks.execute('beforeRequest', context);
```

### Using Middleware

```typescript
import {
	createMiddlewareManager,
	retryMiddleware,
	loggingMiddleware,
	rateLimitMiddleware
} from '@joyboy-parser/addons';

const middleware = createMiddlewareManager();

// Add built-in middleware
middleware.use(retryMiddleware(3, 1000)); // Retry up to 3 times with 1s delay
middleware.use(loggingMiddleware()); // Log requests and responses
middleware.use(rateLimitMiddleware(5)); // Limit to 5 requests per second

// Execute middleware chain
const result = await middleware.execute(
	{ url: 'https://example.com', method: 'GET' },
	async () => {
		// Your actual request logic
		return fetch('https://example.com');
	}
);
```

### Creating Custom Middleware

```typescript
import type { MiddlewareFunction } from '@joyboy-parser/addons';

const authMiddleware: MiddlewareFunction = async (context, next) => {
	if ('url' in context) {
		// Add authentication headers
		context.headers = {
			...context.headers,
			'Authorization': 'Bearer YOUR_TOKEN'
		};
	}
	return next();
};

middleware.use(authMiddleware);
```

## Available Hooks

- `beforeRequest`: Called before making HTTP requests
- `afterRequest`: Called after receiving HTTP responses
- `beforeParse`: Called before parsing HTML content
- `afterParse`: Called after parsing completes
- `onError`: Called when errors occur

## Built-in Middleware

### Retry Middleware

Automatically retry failed requests:

```typescript
import { retryMiddleware } from '@joyboy-parser/addons';

// Retry up to 3 times with exponential backoff (1s, 2s, 3s)
middleware.use(retryMiddleware(3, 1000));
```

### Rate Limiting Middleware

Limit request rate to avoid overwhelming servers:

```typescript
import { rateLimitMiddleware } from '@joyboy-parser/addons';

// Limit to 5 requests per second
middleware.use(rateLimitMiddleware(5));
```

### Logging Middleware

Log request and response information:

```typescript
import { loggingMiddleware } from '@joyboy-parser/addons';

// Use default console.log
middleware.use(loggingMiddleware());

// Or provide custom logger
middleware.use(loggingMiddleware((msg) => myLogger.info(msg)));
```

### Cache Middleware

Cache responses to reduce redundant requests:

```typescript
import { cacheMiddleware } from '@joyboy-parser/addons';

const cache = new Map();
// Cache responses for 60 seconds
middleware.use(cacheMiddleware(cache, 60000));
```

## Extending Sources

You can extend existing sources with plugins:

```typescript
import { BaseSource } from '@joyboy-parser/core';
import { createPluginManager } from '@joyboy-parser/addons';

class MyExtendedSource extends BaseSource {
	private plugins = createPluginManager();

	constructor() {
		super();
		// Initialize with plugins
		this.initializePlugins();
	}

	private async initializePlugins() {
		// Add your plugins
		await this.plugins.use(myPlugin);
	}

	// Override methods to use hooks/middleware
	protected async makeRequest(url: string) {
		const hookManager = this.plugins.getHookManager();
		const middlewareManager = this.plugins.getMiddlewareManager();

		// Execute beforeRequest hooks
		let context = await hookManager.execute('beforeRequest', {
			url,
			headers: {}
		});

		// Execute middleware chain
		return middlewareManager.execute(context, async () => {
			// Actual request logic
			const response = await super.makeRequest(url);
			return hookManager.execute('afterRequest', {
				data: response,
				status: 200
			});
		});
	}
}
```

## API Reference

### PluginManager

```typescript
class PluginManager {
	use(plugin: Plugin): Promise<void>;
	remove(pluginName: string): Promise<void>;
	has(pluginName: string): boolean;
	get(pluginName: string): Plugin | undefined;
	getAll(): Plugin[];
	registerHook<T>(event: keyof Hooks, callback: HookCallback<T>): void;
	registerMiddleware(middleware: MiddlewareFunction): void;
	getHookManager(): HookManager;
	getMiddlewareManager(): MiddlewareManager;
	clear(): Promise<void>;
}
```

### HookManager

```typescript
class HookManager {
	register<T>(event: keyof Hooks, callback: HookCallback<T>): void;
	unregister<T>(event: keyof Hooks, callback: HookCallback<T>): void;
	execute<T>(event: keyof Hooks, data: T): Promise<T>;
	get(event: keyof Hooks): HookCallback[];
	clear(event?: keyof Hooks): void;
	getAll(): Hooks;
}
```

### MiddlewareManager

```typescript
class MiddlewareManager {
	use(middleware: MiddlewareFunction): void;
	remove(middleware: MiddlewareFunction): void;
	execute(context: RequestContext | ResponseContext, handler: () => Promise<any>): Promise<any>;
	getAll(): MiddlewareFunction[];
	clear(): void;
	get count(): number;
}
```

## TypeScript Support

This package is written in TypeScript and includes full type definitions.

```typescript
import type {
	Plugin,
	HookCallback,
	MiddlewareFunction,
	RequestContext,
	ResponseContext
} from '@joyboy-parser/addons';
```

## License

MIT

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Related Packages

- [@joyboy-parser/core](../core) - Core SDK and runtime
- [@joyboy-parser/types](../types) - Type definitions
- [@joyboy-parser/source-registry](../source-registry) - Source registry and catalog
