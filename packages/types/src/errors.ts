/**
 * Error type definitions
 */

/**
 * Error types for standardized error handling
 */
export enum ErrorType {
	NETWORK = 'NETWORK_ERROR',
	PARSE = 'PARSE_ERROR',
	NOT_FOUND = 'NOT_FOUND',
	RATE_LIMIT = 'RATE_LIMIT',
	AUTH = 'AUTH_ERROR',
	TIMEOUT = 'TIMEOUT_ERROR',
	UNKNOWN = 'UNKNOWN_ERROR'
}

/**
 * Standardized error response
 */
export interface SourceError extends Error {
	/** Error type */
	type: ErrorType;
  
	/** Source ID where error occurred */
	sourceId: string;
  
	/** Original error */
	originalError?: Error;
  
	/** Additional context */
	context?: Record<string, any>;
  
	/** HTTP status code (if applicable) */
	statusCode?: number;
}

/**
 * Create a standardized source error
 */
export function createSourceError(
	type: ErrorType,
	message: string,
	sourceId: string,
	originalError?: Error,
	context?: Record<string, any>
): SourceError {
	const error = new Error(message) as SourceError;
	error.type = type;
	error.sourceId = sourceId;
	error.originalError = originalError;
	error.context = {
		...context,
		timestamp: new Date().toISOString()
	};
  
	// Preserve stack trace
	if (originalError?.stack) {
		error.stack = `${error.stack}\nCaused by: ${originalError.stack}`;
	}
  
	return error;
}

