import { sanitizeSelectedTags } from '../sanitizeSelectedTags';
import { FlagTagsFilter } from '../../../@types/types';

describe('sanitizeSelectedTags', () => {
  it('should return empty object for empty input', () => {
    const input: FlagTagsFilter = {};
    const result = sanitizeSelectedTags(input);
    expect(result).toEqual({});
  });

  it('should preserve simple filter structure', () => {
    const input: FlagTagsFilter = {
      Workloads: {
        SAP: true,
        AAP: false,
      },
    };
    const result = sanitizeSelectedTags(input);
    expect(result).toEqual({
      Workloads: {
        SAP: true,
        AAP: false,
      },
    });
  });

  it('should handle multiple namespaces and tags', () => {
    const input: FlagTagsFilter = {
      Workloads: {
        SAP: true,
        AAP: false,
      },
      'SAP IDs (SID)': {
        HXE: true,
      },
    };
    const result = sanitizeSelectedTags(input);
    expect(result).toEqual({
      Workloads: {
        SAP: true,
        AAP: false,
      },
      'SAP IDs (SID)': {
        HXE: true,
      },
    });
  });

  it('should remove keys starting with underscore', () => {
    const input: any = {
      Workloads: {
        SAP: true,
        _internal: 'should be removed',
        __reactInternal: 'should also be removed',
      },
    };
    const result = sanitizeSelectedTags(input);
    expect(result).toEqual({
      Workloads: {
        SAP: true,
      },
    });
  });

  it('should remove keys starting with __react', () => {
    const input: any = {
      Workloads: {
        SAP: true,
        __reactFiber: 'should be removed',
        __reactProps: 'should also be removed',
      },
    };
    const result = sanitizeSelectedTags(input);
    expect(result).toEqual({
      Workloads: {
        SAP: true,
      },
    });
  });

  it('should remove DOM elements', () => {
    // Create a fake DOM node (requires jsdom environment, which is standard for React tests)
    const div = document.createElement('div');

    const input: any = {
      Workloads: {
        SAP: true,
        // This should be stripped out
        someDomNode: div,
      },
      // A valid nested object should remain
      meta: {
        valid: true,
      },
    };

    const result = sanitizeSelectedTags(input);

    expect(result).toEqual({
      Workloads: {
        SAP: true,
      },
      meta: {
        valid: true,
      },
    });
  });

  it('should handle circular references gracefully', () => {
    const input: any = {
      Workloads: {
        SAP: true,
      },
    };
    // Create a circular reference in the object
    input.circular = input;

    const result = sanitizeSelectedTags(input);
    expect(result).toEqual({
      Workloads: {
        SAP: true,
      },
    });
  });

  it('should return original value on parse error', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock JSON.parse to throw an error
    const originalParse = JSON.parse;
    JSON.parse = jest.fn().mockImplementation(() => {
      throw new Error('Parse error');
    });

    const input: FlagTagsFilter = {
      Workloads: {
        SAP: true,
      },
    };

    const result = sanitizeSelectedTags(input);

    // Should return original value when sanitization fails
    expect(result).toBe(input);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[sanitizeSelectedTags] Failed to sanitize selectedTags:', expect.any(Error));

    // Restore
    JSON.parse = originalParse;
    consoleErrorSpy.mockRestore();
  });

  it('should preserve nested tag structures with namespace', () => {
    const input: FlagTagsFilter = {
      myNamespace: {
        'myKey=myValue': true,
      },
      anotherNamespace: {
        'key1=value1': true,
        'key2=value2': false,
      },
    };

    const result = sanitizeSelectedTags(input);
    expect(result).toEqual(input);
  });
});
