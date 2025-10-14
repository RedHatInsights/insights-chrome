# useSearch Hook

The `useSearch` hook exposes Orama search functionality from insights-chrome as a remote federated module. This allows consumer applications to access search capabilities without directly using `useChrome`.

## Basic Usage

### Prerequisites

1. Install `@scalprum/react-core`: `npm install @scalprum/react-core`
2. Ensure your application has access to the chrome federated module

### Example

```tsx
import { useRemoteHook } from '@scalprum/react-core';
import { useState } from 'react';
import type { ChromeSearchAPI, ResultItem } from '@redhat-cloud-services/types';

function SearchComponent() {
  const [searchResults, setSearchResults] = useState<ResultItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { hookResult, loading, error } = useRemoteHook<ChromeSearchAPI>({
    scope: 'chrome',
    module: './search/useSearch'
  });

  const handleSearch = async () => {
    if (!hookResult || !searchTerm) return;
    const results = await hookResult.query(searchTerm, 'services');
    setSearchResults(results);
  };

  if (loading) return <div>Loading search...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search services..."
      />
      <button onClick={handleSearch}>Search</button>
      
      <ul>
        {searchResults.map((result) => (
          <li key={result.id}>
            <a href={result.pathname}>
              <div dangerouslySetInnerHTML={{ __html: result.title }} />
              <div dangerouslySetInnerHTML={{ __html: result.description }} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## API Reference

### `query(term: string, type: SearchDataType | string, env?: ReleaseEnv): Promise<ResultItem[]>`

Search the database for entries matching the search term.

**Parameters:**
- `term` - The search term to query
- `type` - Type of data to search (`'services'`, `'documentation'`, or custom types)
- `env` - Optional environment (`ReleaseEnv.STABLE` or `ReleaseEnv.PREVIEW`, defaults to `STABLE`)

**Returns:** Promise with array of `ResultItem` objects:
```typescript
{
  id: string;
  title: string;        
  description: string;  
  bundleTitle: string;
  pathname: string;
}
```

### `insert(data: SearchEntry): Promise<void>`

Insert a new entry into the search database.

**Parameters:**
- `data` - SearchEntry object:
```typescript
{
  id: string;
  title: string;
  bundleTitle: string;
  pathname: string;
  description?: string;
  altTitle?: string[];
  type: SearchDataType | string;
}
```

**Example:**
```tsx
await hookResult.insert({
  id: 'my-page',
  title: 'Custom Dashboard',
  bundleTitle: 'My Bundle',
  pathname: '/my-bundle/dashboard',
  description: 'A custom dashboard',
  type: 'services'
});
```

## Additional Examples

### Custom Wrapper Hook

```tsx
function useChromeSearch() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { hookResult, loading, error } = useRemoteHook<ChromeSearchAPI>({
    scope: 'chrome',
    module: './search/useSearch'
  });

  const search = async (term: string) => {
    if (!hookResult) return;
    setIsSearching(true);
    try {
      const searchResults = await hookResult.query(term, 'services');
      setResults(searchResults);
    } finally {
      setIsSearching(false);
    }
  };

  return { search, results, isSearching, loading, error };
}
```

### Search Multiple Types

```tsx
const searchAll = async (term: string) => {
  if (!hookResult) return;
  
  const [serviceResults, docResults] = await Promise.all([
    hookResult.query(term, 'services'),
    hookResult.query(term, 'documentation')
  ]);

  return { services: serviceResults, documentation: docResults };
};
```

## Important Notes

**Highlighted Results:** The `title` and `description` fields contain HTML with highlighted search matches. Render using `dangerouslySetInnerHTML` or sanitize with DOMPurify.

**Error Handling:** Always check for loading and error states:
```tsx
if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!hookResult) return null;
```

**Performance:**
- Search queries are cached internally
- Results are limited to 10 items per query
- Consider debouncing search input

**TypeScript:** Import types from `@redhat-cloud-services/types`:
```tsx
import type { ChromeSearchAPI, SearchEntry, ResultItem } from '@redhat-cloud-services/types';
```

## Troubleshooting

**Hook not loading:** Ensure the chrome module is accessible and properly configured in your module federation setup.

**Empty results:** The search database may not be initialized yet, or the search term doesn't match any entries.

**Module Federation errors:** Ensure your webpack config includes:
```javascript
remotes: {
  chrome: 'chrome@/apps/chrome/js/chrome.js'
}
```

## Migration from useChrome

**Before:**
```tsx
const { search } = useChrome();
const results = await search.query('term', 'services');
```

**After:**
```tsx
const { hookResult } = useRemoteHook<ChromeSearchAPI>({
  scope: 'chrome',
  module: './useSearch'
});
if (hookResult) {
  const results = await hookResult.query('term', 'services');
}
```

## See Also

- [useRemoteHook Documentation](https://github.com/scalprum/scaffolding/blob/main/packages/react-core/docs/use-remote-hook.md)
- [Module Federation Documentation](https://webpack.js.org/concepts/module-federation/)
- [Orama Search Documentation](https://docs.oramasearch.com/)
