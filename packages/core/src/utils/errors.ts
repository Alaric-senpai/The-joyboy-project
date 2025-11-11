/**
 * Error utilities
 */

import { ErrorType, type SourceError } from '@joyboy-parser/types';

/**
 * Check if an error is a SourceError
 */
export function isSourceError(error: any): error is SourceError {
	return (
		error &&
		typeof error === 'object' &&
		'type' in error &&
		'sourceId' in error &&
		Object.values(ErrorType).includes(error.type)
	);
}

/**
 * Format error for display
 */
export function formatError(error: Error | SourceError): string {
	if (isSourceError(error)) {
		return `[${error.sourceId}] ${error.type}: ${error.message}`;
	}
	return error.message;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error | SourceError): boolean {
	if (isSourceError(error)) {
		return [
			ErrorType.NETWORK,
			ErrorType.TIMEOUT,
			ErrorType.RATE_LIMIT
		].includes(error.type);
	}
	return false;
}

