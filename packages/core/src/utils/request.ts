/**
 * HTTP request utilities compatible with all runtimes
 */

import type { RequestOptions } from '@joyboy/types';

/**
 * Request manager with retry logic and timeout handling
 * Works in Node.js, Browser, and React Native
 */
export class RequestManager {
	private defaultTimeout = 30000;
	private defaultRetries = 3;
  
	/**
	 * Make an HTTP request with automatic retry
	 */
	async request<T = any>(
		url: string,
		options?: RequestOptions
	): Promise<T> {
		const maxRetries = options?.retries ?? this.defaultRetries;
		const timeout = options?.timeout ?? this.defaultTimeout;
    
		let lastError: Error | undefined;
    
		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), timeout);
        
				const response = await fetch(url, {
					method: options?.method || 'GET',
					headers: options?.headers,
					body: options?.body ? JSON.stringify(options.body) : undefined,
					signal: controller.signal
				});
        
				clearTimeout(timeoutId);
        
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
        
				const contentType = response.headers.get('content-type');
        
				if (contentType?.includes('application/json')) {
					return await response.json() as T;
				} else {
					return await response.text() as T;
				}
			} catch (error) {
				lastError = error as Error;
        
				// Don't retry on 4xx errors
				if (lastError.message.includes('HTTP 4')) {
					throw lastError;
				}
        
				if (attempt < maxRetries - 1) {
					await this.delay(Math.pow(2, attempt) * 1000);
				}
			}
		}
    
		throw new Error(
			`Request failed after ${maxRetries} attempts: ${lastError?.message}`
		);
	}
  
	/**
	 * Fetch HTML/text content
	 */
	async fetchText(url: string, options?: RequestOptions): Promise<string> {
		const controller = new AbortController();
		const timeout = options?.timeout ?? this.defaultTimeout;
		const timeoutId = setTimeout(() => controller.abort(), timeout);
    
		try {
			const response = await fetch(url, {
				method: options?.method || 'GET',
				headers: options?.headers,
				signal: controller.signal
			});
      
			clearTimeout(timeoutId);
      
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
      
			return await response.text();
		} catch (error) {
			throw new Error(`Failed to fetch text: ${(error as Error).message}`);
		}
	}
  
	/**
	 * Delay utility
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

