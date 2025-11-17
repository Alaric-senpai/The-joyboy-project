/**
 * HTTP-specific error class with enhanced details
 */

export class HttpError extends Error {
	public readonly statusCode: number;
	public readonly url: string;
	public readonly method: string;
	public readonly responseData?: any;
	public readonly headers?: Record<string, string>;

	constructor(
		message: string,
		statusCode: number,
		url: string,
		method: string = 'GET',
		responseData?: any,
		headers?: Record<string, string>
	) {
		super(message);
		this.name = 'HttpError';
		this.statusCode = statusCode;
		this.url = url;
		this.method = method;
		this.responseData = responseData;
		this.headers = headers;

		// Maintains proper stack trace for where error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, HttpError);
		}
	}

	/**
	 * Check if error is a client error (4xx)
	 */
	isClientError(): boolean {
		return this.statusCode >= 400 && this.statusCode < 500;
	}

	/**
	 * Check if error is a server error (5xx)
	 */
	isServerError(): boolean {
		return this.statusCode >= 500 && this.statusCode < 600;
	}

	/**
	 * Get a user-friendly error message
	 */
	getUserMessage(): string {
		if (this.statusCode === 404) {
			return 'The requested resource was not found';
		}
		if (this.statusCode === 429) {
			return 'Too many requests. Please try again later';
		}
		if (this.statusCode === 403) {
			return 'Access forbidden';
		}
		if (this.statusCode === 401) {
			return 'Authentication required';
		}
		if (this.isServerError()) {
			return 'The server encountered an error. Please try again later';
		}
		return this.message;
	}

	/**
	 * Convert to JSON for logging
	 */
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			statusCode: this.statusCode,
			url: this.url,
			method: this.method,
			responseData: this.responseData,
			headers: this.headers,
			stack: this.stack
		};
	}
}

/**
 * Network/timeout error
 */
export class NetworkError extends Error {
	public readonly url: string;
	public readonly timeout?: boolean;

	constructor(message: string, url: string, timeout: boolean = false) {
		super(message);
		this.name = 'NetworkError';
		this.url = url;
		this.timeout = timeout;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, NetworkError);
		}
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			url: this.url,
			timeout: this.timeout,
			stack: this.stack
		};
	}
}
