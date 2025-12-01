import { FlagTagsFilter } from '../../@types/types';

/**
 * Sanitizes selectedTags object by removing circular references and non-serializable data
 * (React Fiber nodes, DOM elements, etc.) while preserving the filter data structure.
 *
 * @param selectedTags - The raw selectedTags object from useTagsFilter hook
 * @returns Sanitized object safe for JSON serialization
 */
export const sanitizeSelectedTags = (selectedTags: FlagTagsFilter): FlagTagsFilter => {
  try {
    // Use a custom replacer to handle circular references
    const seen = new WeakSet();
    const sanitized = JSON.parse(
      JSON.stringify(selectedTags, (key, value) => {
        // Skip React internal keys
        if (key.startsWith('_') || key.startsWith('__react')) {
          return undefined;
        }
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          // Skip DOM nodes
          if (value instanceof HTMLElement) {
            return undefined;
          }
          // Skip circular references
          if (seen.has(value)) {
            return undefined;
          }
          seen.add(value);
        }
        return value;
      })
    );
    return sanitized;
  } catch (error) {
    console.error('[sanitizeSelectedTags] Failed to sanitize selectedTags:', error);
    // Fallback: return original value
    return selectedTags;
  }
};
