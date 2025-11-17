import type { MiddlewareFunction, RequestContext, ResponseContext } from './types';

/**
 * Middleware manager for request/response interceptors
 */
export class MiddlewareManager {
	private middleware: MiddlewareFunction[] = [];

	/**
	 * Register a middleware function
	 */
	use(middleware: MiddlewareFunction): void {
		this.middleware.push(middleware);
	}

	/**
	 * Remove a middleware function
	 */
	remove(middleware: MiddlewareFunction): void {
		const index = this.middleware.indexOf(middleware);
		if (index > -1) {
			this.middleware.splice(index, 1);
		}
	}

	/**
	 * Execute middleware chain
	 */
	async execute(
		context: RequestContext | ResponseContext,
		handler: () => Promise<any>
	): Promise<any> {
		if (this.middleware.length === 0) {
			return handler();
		}

		let index = 0;
		const next = async (): Promise<any> => {
			if (index >= this.middleware.length) {
				return handler();
			}
			const middleware = this.middleware[index++];
			return middleware(context, next);
		};

		return next();
	}

	/**
	 * Get all registered middleware
	 */
	getAll(): MiddlewareFunction[] {
		return [...this.middleware];
	}

	/**
	 * Clear all middleware
	 */
	clear(): void {
		this.middleware = [];
	}

	/**
	 * Get middleware count
	 */
	get count(): number {
		return this.middleware.length;
	}
}

/**
 * Create a new middleware manager instance
 */
export function createMiddlewareManager(): MiddlewareManager {
	return new MiddlewareManager();
}

/**
 * Common middleware utilities
 */

/**
 * Retry middleware - retry failed requests
 */
export function retryMiddleware(maxRetries: number = 3, delay: number = 1000): MiddlewareFunction {
	return async (context, next) => {
		let lastError: Error | undefined;
		
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await next();
			} catch (error) {
				lastError = error as Error;
				if (attempt < maxRetries) {
					await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
				}
			}
		}
		
		throw lastError;
	};
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(requestsPerSecond: number): MiddlewareFunction {
	const queue: Array<() => void> = [];
	const interval = 1000 / requestsPerSecond;
	let lastRequest = 0;

	const processQueue = () => {
		const now = Date.now();
		if (now - lastRequest >= interval && queue.length > 0) {
			lastRequest = now;
			const resolve = queue.shift();
			resolve?.();
		}
	};

	setInterval(processQueue, interval / 2);

	return async (context, next) => {
		const now = Date.now();
		if (now - lastRequest >= interval) {
			lastRequest = now;
			return next();
		}

		await new Promise<void>(resolve => {
			queue.push(resolve);
		});
		return next();
	};
}

/**
 * Logging middleware
 */
export function loggingMiddleware(logger?: (message: string) => void): MiddlewareFunction {
	const log = logger || console.log;
	
	return async (context, next) => {
		const isRequest = 'url' in context && 'method' in context;
		
		if (isRequest) {
			const req = context as RequestContext;
			log(`→ ${req.method || 'GET'} ${req.url}`);
		}
		
		const startTime = Date.now();
		try {
			const result = await next();
			const duration = Date.now() - startTime;
			
			if (!isRequest) {
				const res = context as ResponseContext;
				log(`← ${res.status} (${duration}ms)`);
			}
			
			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			log(`✕ Error (${duration}ms): ${(error as Error).message}`);
			throw error;
		}
	};
}

/**
 * Cache middleware
 */
export function cacheMiddleware(cache: Map<string, any>, ttl: number = 60000): MiddlewareFunction {
	return async (context, next) => {
		if ('url' in context) {
			const req = context as RequestContext;
			const cacheKey = `${req.method || 'GET'}:${req.url}`;
			const cached = cache.get(cacheKey);
			
			if (cached && Date.now() - cached.timestamp < ttl) {
				return cached.data;
			}
			
			const result = await next();
			cache.set(cacheKey, { data: result, timestamp: Date.now() });
			return result;
		}
		
		return next();
	};
}
