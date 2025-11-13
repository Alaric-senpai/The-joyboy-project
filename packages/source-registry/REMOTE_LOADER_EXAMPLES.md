// USAGE EXAMPLES: RemoteSourceLoader for Web, Node.js, and React Native/Expo

// ============================================================================
// 1. WEB (Browser) Usage
// ============================================================================

import { RemoteSourceLoader } from '@joyboy-parser/source-registry';
import { BaseSource } from '@joyboy-parser/core';

// Create loader with BaseSource injection
const loader = new RemoteSourceLoader({
  baseSourceClass: BaseSource,
  strictValidation: true,
});

// Load a remote source
async function loadWebSource() {
  try {
    const sourceUrl = 'https://cdn.example.com/sources/mangadex.js';
    const SourceClass = await loader.loadSourceClass(sourceUrl);
    
    // Instantiate the loaded source
    const source = new SourceClass();
    console.log('Loaded source:', source.info);
    
    // Use the source
    const results = await source.search('one piece');
    console.log('Search results:', results);
  } catch (error) {
    console.error('Failed to load source:', error);
  }
}

// ============================================================================
// 2. NODE.JS Usage
// ============================================================================

import { RemoteSourceLoader } from '@joyboy-parser/source-registry';
import { BaseSource } from '@joyboy-parser/core';

const loader = new RemoteSourceLoader({
  baseSourceClass: BaseSource,
});

async function loadNodeSource() {
  const runtime = loader.getRuntime();
  console.log('Running in:', runtime); // 'node'
  
  const sourceUrl = 'https://raw.githubusercontent.com/user/repo/main/sources/mangadex.js';
  const SourceClass = await loader.loadSourceClass(sourceUrl);
  
  const source = new SourceClass();
  const manga = await source.getMangaDetails('manga-id');
  console.log(manga);
}

// ============================================================================
// 3. REACT NATIVE / EXPO Usage
// ============================================================================

// App.tsx or your source manager component
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { RemoteSourceLoader } from '@joyboy-parser/source-registry';
import { BaseSource } from '@joyboy-parser/core';

export function SourceLoader() {
  const [source, setSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRemoteSource();
  }, []);

  async function loadRemoteSource() {
    try {
      const loader = new RemoteSourceLoader({
        baseSourceClass: BaseSource,
        // Optional: inject additional globals for React Native
        globals: {
          // Add any RN-specific globals if needed
        },
      });

      console.log('Runtime:', loader.getRuntime()); // 'react-native'

      const sourceUrl = 'https://cdn.example.com/sources/mangadex.js';
      const SourceClass = await loader.loadSourceClass(sourceUrl);
      
      const sourceInstance = new SourceClass();
      setSource(sourceInstance);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (loading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View>
      <Text>Loaded: {source?.info?.name}</Text>
    </View>
  );
}

// ============================================================================
// 4. Advanced: Multiple Sources with Caching
// ============================================================================

class SourceManager {
  private loader: RemoteSourceLoader;
  private sources: Map<string, any> = new Map();

  constructor() {
    this.loader = new RemoteSourceLoader({
      baseSourceClass: BaseSource,
    });
  }

  async loadSource(id: string, url: string) {
    if (this.sources.has(id)) {
      return this.sources.get(id);
    }

    const SourceClass = await this.loader.loadSourceClass(url);
    const instance = new SourceClass();
    this.sources.set(id, instance);
    
    return instance;
  }

  getSource(id: string) {
    return this.sources.get(id);
  }

  clearCaches() {
    this.loader.clearAllCaches();
    this.sources.clear();
  }
}

// Usage
const manager = new SourceManager();
await manager.loadSource('mangadex', 'https://cdn.example.com/mangadex.js');
const source = manager.getSource('mangadex');

// ============================================================================
// 5. With Registry Integration
// ============================================================================

import { sourceCatalog, RemoteSourceLoader } from '@joyboy-parser/source-registry';
import { BaseSource } from '@joyboy-parser/core';

async function loadFromRegistry() {
  const loader = new RemoteSourceLoader({
    baseSourceClass: BaseSource,
  });

  // Get source info from catalog
  const sourceInfo = sourceCatalog.getSource('mangadex');
  
  if (sourceInfo?.cdnUrl) {
    // Load from CDN
    const SourceClass = await loader.loadSourceClass(sourceInfo.cdnUrl);
    return new SourceClass();
  } else {
    // Install from npm instead
    console.log('Install with:', sourceInfo?.installCommand);
  }
}

// ============================================================================
// 6. Error Handling Best Practices
// ============================================================================

async function safeLoadSource(url: string) {
  const loader = new RemoteSourceLoader({
    baseSourceClass: BaseSource,
    strictValidation: true, // Enable validation
  });

  try {
    // Download with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const SourceClass = await loader.loadSourceClass(url);
    clearTimeout(timeoutId);
    
    return new SourceClass();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Download failed')) {
        console.error('Network error:', error);
      } else if (error.message.includes('Invalid source')) {
        console.error('Invalid source code:', error);
      } else {
        console.error('Unknown error:', error);
      }
    }
    throw error;
  }
}

// ============================================================================
// 7. Expo Specific: With AsyncStorage Caching
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

class ExpoSourceLoader {
  private loader: RemoteSourceLoader;
  private cacheKey = '@sources:cache';

  constructor() {
    this.loader = new RemoteSourceLoader({
      baseSourceClass: BaseSource,
    });
  }

  async loadWithPersistentCache(id: string, url: string) {
    // Try to load from AsyncStorage first
    try {
      const cached = await AsyncStorage.getItem(`${this.cacheKey}:${id}`);
      if (cached) {
        const code = JSON.parse(cached);
        // Inject into loader cache
        this.loader['cache'].set(url, code.data);
      }
    } catch (e) {
      console.log('No cache found');
    }

    // Load source
    const code = await this.loader.downloadSource(url);
    
    // Persist to AsyncStorage
    await AsyncStorage.setItem(
      `${this.cacheKey}:${id}`,
      JSON.stringify({ data: code, timestamp: Date.now() })
    );

    return this.loader.loadFromUrl(url);
  }
}
