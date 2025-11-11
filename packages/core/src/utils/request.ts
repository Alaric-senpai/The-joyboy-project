/**
 * HTTP request utilities compatible with all runtimes
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { RequestOptions } from '@joyboy/types';

/**
 * Request manager with retry logic and timeout handling
 * Works in Node.js, Browser, and React Native using axios
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
				const axiosConfig: AxiosRequestConfig = {
					url,
					method: options?.method || 'GET',
					headers: options?.headers,
					data: options?.body,
					timeout,
					validateStatus: (status: number) => status >= 200 && status < 300
				};
        
				const response: AxiosResponse<T> = await axios(axiosConfig);
        
				return response.data;
			} catch (error) {
				const axiosError = error as AxiosError;
				lastError = error as Error;
        
				// Don't retry on 4xx client errors
				if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
					const errorDetails = {
						statusCode: axiosError.response.status,
						statusText: axiosError.response.statusText,
						url: url,
						method: options?.method || 'GET',
						responseData: axiosError.response.data
					};
					
					const error = new Error(`HTTP ${axiosError.response.status}: ${axiosError.response.statusText || axiosError.message}`) as any;
					error.statusCode = errorDetails.statusCode;
					error.url = errorDetails.url;
					error.method = errorDetails.method;
					error.responseData = errorDetails.responseData;
					
					throw error;
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
		const timeout = options?.timeout ?? this.defaultTimeout;
    
		try {
			const axiosConfig: AxiosRequestConfig = {
				url,
				method: options?.method || 'GET',
				headers: options?.headers,
				timeout,
				responseType: 'text'
			};
      
			const response: AxiosResponse<string> = await axios(axiosConfig);
      
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError;
			const status = axiosError.response?.status;
			const statusText = axiosError.response?.statusText || axiosError.message;
			throw new Error(`Failed to fetch text: HTTP ${status || 'Error'}: ${statusText}`);
		}
	}
  
	/**
	 * Delay utility
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

