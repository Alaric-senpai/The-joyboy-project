/**
 * @joyboy-parser/source-registry v1.2.0
 * Simplified exports - Remote-only, no bundled JSON
 */

export { RemoteRegistry, createRemoteRegistry, REGISTRY_URLS } from './remote-registry';
export type { RemoteRegistryConfig } from './remote-registry';
export * from './types';

// Convenience singleton
import { RemoteRegistry } from './remote-registry';
import type { RegistrySource } from './types';

/** Default registry instance */
const defaultRegistry = new RemoteRegistry();

/**
 * Get all available sources (always fetches fresh)
 */
export async function getAllSources(): Promise<RegistrySource[]> {
  return defaultRegistry.getSources();
}

/**
 * Get a source by ID (always fetches fresh)
 */
export async function getSourceById(id: string): Promise<RegistrySource | undefined> {
  return defaultRegistry.getSource(id);
}

/**
 * Search sources by query (always fetches fresh)
 */
export async function searchSources(query: string): Promise<RegistrySource[]> {
  return defaultRegistry.searchSources(query);
}
