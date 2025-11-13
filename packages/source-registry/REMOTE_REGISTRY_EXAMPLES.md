# RemoteRegistry Cross-Platform Usage Examples

## Overview

The `RemoteRegistry` class is now fully compatible with:
- ✅ Web browsers (Chrome, Firefox, Safari, etc.)
- ✅ Node.js 18+ (with native fetch)
- ✅ Node.js < 18 (with custom fetch polyfill)
- ✅ React Native (Metro bundler)
- ✅ Expo (SDK 45+)

## Basic Usage

### Web / Node.js 18+ / React Native / Expo

```typescript
import { RemoteRegistry, DEFAULT_REGISTRY_URLS } from '@joyboy-parser/source-registry';

// Create registry instance
const registry = new RemoteRegistry({
  registryUrl: DEFAULT_REGISTRY_URLS.github,
  cacheDuration: 3 * 60 * 60 * 1000, // 3 hours
  timeout: 30000, // 30 seconds
});

// Fetch registry data
const sources = await registry.fetchRegistry();
console.log(`Loaded ${sources.length} sources`);

// Subsequent calls use cache
const cachedSources = await registry.fetchRegistry();

// Check cache status
const cacheInfo = registry.getCacheInfo();
console.log('Cache status:', cacheInfo);

// Force refresh
const freshSources = await registry.refresh();
```

## Platform-Specific Examples

### 1. Web Browser

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>JoyBoy Registry</title>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { RemoteRegistry, DEFAULT_REGISTRY_URLS } from '@joyboy-parser/source-registry';

    async function loadRegistry() {
      const registry = new RemoteRegistry({
        registryUrl: DEFAULT_REGISTRY_URLS.github,
      });

      try {
        const sources = await registry.fetchRegistry();
        document.getElementById('app').innerHTML = `
          <h1>Available Sources: ${sources.length}</h1>
          <ul>
            ${sources.map(s => `<li>${s.name} - ${s.description}</li>`).join('')}
          </ul>
        `;
      } catch (error) {
        console.error('Failed to load registry:', error);
        document.getElementById('app').innerHTML = '<p>Error loading registry</p>';
      }
    }

    loadRegistry();
  </script>
</body>
</html>
```

### 2. Node.js 18+ (Native Fetch)

```typescript
import { RemoteRegistry, createRemoteRegistry } from '@joyboy-parser/source-registry';

async function main() {
  // Method 1: Direct instantiation
  const registry = new RemoteRegistry({
    registryUrl: 'https://cdn.jsdelivr.net/gh/Alaric-senpai/The-joyboy-project@main/registry/sources.json',
    timeout: 10000,
  });

  // Method 2: Using helper function
  const registry2 = createRemoteRegistry();

  const sources = await registry.fetchRegistry();
  
  // Use sources
  sources.forEach(source => {
    console.log(`${source.name}: ${source.packageName}`);
  });
}

main();
```

### 3. Node.js < 18 (With node-fetch polyfill)

```typescript
// First install: npm install node-fetch@2
import fetch from 'node-fetch';
import { RemoteRegistry } from '@joyboy-parser/source-registry';

const registry = new RemoteRegistry({
  registryUrl: 'https://cdn.jsdelivr.net/gh/Alaric-senpai/The-joyboy-project@main/registry/sources.json',
  fetchImplementation: fetch as any, // Provide polyfill
});

const sources = await registry.fetchRegistry();
console.log(sources);
```

### 4. React Native / Expo

```tsx
// App.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { RemoteRegistry, DEFAULT_REGISTRY_URLS } from '@joyboy-parser/source-registry';

export default function App() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    try {
      const registry = new RemoteRegistry({
        registryUrl: DEFAULT_REGISTRY_URLS.github,
        timeout: 15000, // RN might need longer timeout
      });

      const data = await registry.fetchRegistry();
      setSources(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading registry...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Sources ({sources.length})</Text>
      <FlatList
        data={sources}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.version}>v{item.version}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  item: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 18, fontWeight: '600' },
  description: { fontSize: 14, color: '#666', marginTop: 4 },
  version: { fontSize: 12, color: '#999', marginTop: 4 },
  error: { color: 'red', fontSize: 16 },
});
```

### 5. React Native with AsyncStorage Caching

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RemoteRegistry, RegistryEntry } from '@joyboy-parser/source-registry';

class CachedRegistry {
  private registry: RemoteRegistry;
  private storageKey = '@joyboy:registry';

  constructor() {
    this.registry = new RemoteRegistry({
      registryUrl: 'https://raw.githubusercontent.com/Alaric-senpai/The-joyboy-project/main/registry/sources.json',
    });
  }

  async fetchWithPersistence(): Promise<RegistryEntry[]> {
    try {
      // Try to load from AsyncStorage first
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const age = Date.now() - parsed.timestamp;
        
        // Use cached if less than 6 hours old
        if (age < 6 * 60 * 60 * 1000) {
          console.log('Using persisted cache');
          return parsed.data;
        }
      }

      // Fetch fresh data
      const sources = await this.registry.fetchRegistry();
      
      // Persist to AsyncStorage
      await AsyncStorage.setItem(
        this.storageKey,
        JSON.stringify({ data: sources, timestamp: Date.now() })
      );

      return sources;
    } catch (error) {
      // Fallback to stored cache on error
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        console.log('Using stale cache due to error');
        return JSON.parse(stored).data;
      }
      throw error;
    }
  }

  async clearPersistedCache() {
    await AsyncStorage.removeItem(this.storageKey);
    this.registry.clearCache();
  }
}

// Usage
const cachedRegistry = new CachedRegistry();
const sources = await cachedRegistry.fetchWithPersistence();
```

## Advanced: Custom Fetch Implementation

For environments with special requirements:

```typescript
import { RemoteRegistry } from '@joyboy-parser/source-registry';

// Custom fetch with authentication
async function authenticatedFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await getAuthToken(); // Your auth logic
  
  return fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      'Authorization': `Bearer ${token}`,
      'X-Custom-Header': 'value',
    },
  });
}

const registry = new RemoteRegistry({
  registryUrl: 'https://api.example.com/private-registry',
  fetchImplementation: authenticatedFetch,
  timeout: 20000,
});

const sources = await registry.fetchRegistry();
```

## Error Handling

```typescript
import { RemoteRegistry } from '@joyboy-parser/source-registry';

async function safeLoadRegistry() {
  const registry = new RemoteRegistry({
    registryUrl: DEFAULT_REGISTRY_URLS.github,
    timeout: 10000,
  });

  try {
    const sources = await registry.fetchRegistry();
    return sources;
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.error('Registry fetch timed out');
      // Maybe try alternative URL
      const fallbackRegistry = new RemoteRegistry({
        registryUrl: DEFAULT_REGISTRY_URLS.jsdelivr,
      });
      return await fallbackRegistry.fetchRegistry();
    } else if (error.message.includes('network')) {
      console.error('Network error - check your connection');
      // Use bundled sources as fallback
      return [];
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}
```

## Integration with SourceCatalog

```typescript
import { SourceCatalog, RemoteRegistry } from '@joyboy-parser/source-registry';

// Create catalog with remote sync
const catalog = new SourceCatalog(DEFAULT_REGISTRY_URLS.github);

// Sync with remote
await catalog.syncWithRemote();

// Now search includes remote sources
const mangaSources = catalog.searchSources('manga');
const englishSources = catalog.getSourcesByLanguage('en');
```

## React Hook for Easier Integration

```tsx
import { useState, useEffect } from 'react';
import { RemoteRegistry, RegistryEntry } from '@joyboy-parser/source-registry';

function useRemoteRegistry(url?: string) {
  const [sources, setSources] = useState<RegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const registry = new RemoteRegistry({
      registryUrl: url || DEFAULT_REGISTRY_URLS.github,
    });

    registry
      .fetchRegistry()
      .then(setSources)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { sources, loading, error };
}

// Usage
function MyComponent() {
  const { sources, loading, error } = useRemoteRegistry();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {sources.map(s => (
        <li key={s.id}>{s.name}</li>
      ))}
    </ul>
  );
}
```

## Compatibility Notes

| Feature | Web | Node 18+ | Node < 18 | React Native | Expo |
|---------|-----|----------|-----------|--------------|------|
| Native fetch | ✅ | ✅ | ❌ (need polyfill) | ✅ | ✅ |
| AbortController | ✅ | ✅ | ❌ (fallback used) | ✅ | ✅ |
| Timeout handling | ✅ (AbortController) | ✅ (AbortController) | ✅ (Promise.race) | ✅ (AbortController) | ✅ (AbortController) |
| Caching | ✅ (in-memory) | ✅ (in-memory) | ✅ (in-memory) | ✅ (in-memory) | ✅ (in-memory + AsyncStorage) |

## Performance Tips

1. **Set appropriate cache duration** - Default is 3 hours, adjust based on your needs
2. **Use shorter timeouts on mobile** - Network conditions vary more
3. **Implement persistent caching** - Use AsyncStorage (RN) or localStorage (Web) for offline support
4. **Provide fallback URLs** - Use jsdelivr or other CDNs as alternatives
5. **Handle errors gracefully** - Always provide fallback to bundled sources

## Security Considerations

- ✅ Only fetch from trusted URLs (your own servers, official CDNs)
- ✅ Validate registry data structure after fetch
- ✅ Use HTTPS URLs only
- ✅ Consider implementing integrity checks (SHA-256 hashes)
- ❌ Never fetch from user-provided arbitrary URLs without validation
