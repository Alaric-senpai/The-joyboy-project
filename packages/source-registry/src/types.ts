/**
 * Changelog entry for a source version
 */
export interface ChangelogEntry {
  /** Version number (semver) */
  version: string;
  /** Release date (ISO 8601) */
  date: string;
  /** List of changes */
  changes: string[];
  /** Whether this version has breaking changes */
  breaking: boolean;
}

/**
 * Download URLs for a source
 */
export interface SourceDownloads {
  /** Stable release URL */
  stable: string;
  /** Latest version URL (may be unstable) */
  latest: string;
  /** Version-specific URLs */
  versions: Record<string, string>;
}

/**
 * Integrity verification hashes
 */
export interface SourceIntegrity {
  /** SHA-256 hash of the source file */
  sha256: string;
  /** SHA-512 hash (optional) */
  sha512?: string;
}

/**
 * Source metadata
 */
export interface SourceMetadata {
  /** Supported language codes (ISO 639-1) */
  languages: string[];
  /** Whether the source contains NSFW content */
  nsfw: boolean;
  /** Whether this is an official/verified source */
  official: boolean;
  /** Tags for categorization */
  tags: string[];
  /** Last updated timestamp (ISO 8601) */
  lastUpdated: string;
  /** Minimum core version required (semver) */
  minCoreVersion: string;
  /** Maximum core version supported (semver, optional) */
  maxCoreVersion?: string;
  /** Official website URL */
  websiteUrl: string;
  /** Support/issues URL */
  supportUrl: string;
}

/**
 * Legal information
 */
export interface SourceLegal {
  /** Legal disclaimer */
  disclaimer: string;
  /** Type of source (api, scraper, hybrid) */
  sourceType: 'api' | 'scraper' | 'hybrid';
  /** Whether authentication is required */
  requiresAuth: boolean;
  /** Terms of service URL */
  termsOfServiceUrl?: string;
}

/**
 * Usage statistics
 */
export interface SourceStatistics {
  /** Total downloads */
  downloads: number;
  /** GitHub stars (if applicable) */
  stars: number;
  /** User rating (0-5) */
  rating: number;
  /** Active users count */
  activeUsers: number;
}

/**
 * Source capabilities
 */
export interface SourceCapabilities {
  /** Supports search functionality */
  supportsSearch: boolean;
  /** Supports trending/popular listings */
  supportsTrending: boolean;
  /** Supports latest updates */
  supportsLatest: boolean;
  /** Supports advanced filters */
  supportsFilters: boolean;
  /** Supports popular listings */
  supportsPopular: boolean;
  /** Supports authentication */
  supportsAuth: boolean;
  /** Supports chapter downloads */
  supportsDownload: boolean;
  /** Supports bookmarks */
  supportsBookmarks: boolean;
}

/**
 * Registry entry describing a source available in the catalog
 */
export interface RegistrySource {
  /** Unique source identifier (lowercase with hyphens) */
  id: string;
  /** Display name */
  name: string;
  /** Version (semver) */
  version: string;
  /** Base URL of the source */
  baseUrl: string;
  /** Description */
  description: string;
  /** Icon URL */
  icon: string;
  /** Author/maintainer */
  author: string;
  /** Repository URL */
  repository: string;
  /** Download URLs */
  downloads: SourceDownloads;
  /** Integrity hashes */
  integrity: SourceIntegrity;
  /** Metadata */
  metadata: SourceMetadata;
  /** Legal information */
  legal: SourceLegal;
  /** Changelog */
  changelog: ChangelogEntry[];
  /** Statistics */
  statistics: SourceStatistics;
  /** Capabilities */
  capabilities: SourceCapabilities;
}

/**
 * Registry metadata
 */
export interface RegistryMetadata {
  /** Last update timestamp (ISO 8601) */
  lastUpdated: string;
  /** Total number of sources */
  totalSources: number;
  /** Registry maintainer */
  maintainer: string;
  /** Registry URL */
  url: string;
  /** Registry description */
  description: string;
  /** License */
  license: string;
}

/**
 * Registry notice/announcement
 */
export interface RegistryNotice {
  /** Notice type */
  type: 'info' | 'warning' | 'error';
  /** Notice title */
  title: string;
  /** Notice message */
  message: string;
  /** Publication date (ISO 8601) */
  date: string;
  /** Whether users can dismiss this notice */
  dismissible: boolean;
}

/**
 * Complete registry structure
 */
export interface Registry {
  /** Registry version (semver) */
  version: string;
  /** Registry metadata */
  metadata: RegistryMetadata;
  /** Available sources */
  sources: RegistrySource[];
  /** Source categories */
  categories: Record<string, string[]>;
  /** Featured source IDs */
  featured: string[];
  /** Deprecated source IDs */
  deprecated: string[];
  /** Notices/announcements */
  notices: RegistryNotice[];
}

/**
 * Legacy type alias for backward compatibility
 * @deprecated Use RegistrySource instead
 */
export type RegistryEntry = RegistrySource;