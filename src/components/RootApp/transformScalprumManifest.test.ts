import { PluginManifest } from '@openshift/dynamic-plugin-sdk';
import transformScalprumManifest from './transformScalprumManifest';
import { ScalprumConfig } from '../../state/atoms/scalprumConfigAtom';

describe('transformScalprumManifest', () => {
  it('should not make any changes to manifest', () => {
    const manifest: PluginManifest = {
      version: '1.0.0',
      baseURL: '/',
      name: 'foo',
      loadScripts: ['/script1.js', '/script2.js'],
      extensions: [],
      registrationMethod: 'callback',
    };
    const result = transformScalprumManifest(manifest, {});
    expect(result).toEqual({
      ...manifest,
    });
  });

  it('should remote load scripts from manifest for chrome app', () => {
    const manifest: PluginManifest = {
      version: '1.0.0',
      baseURL: '/',
      name: 'chrome',
      loadScripts: ['/script1.js', '/script2.js'],
      extensions: [],
      registrationMethod: 'callback',
    };

    const result = transformScalprumManifest(manifest, {});
    expect(result).toEqual({
      ...manifest,
      loadScripts: [],
    });
  });

  it('should prefix baseURL with /api/plugins/ for hac- plugins manifest', () => {
    const manifest: PluginManifest = {
      version: '1.0.0',
      baseURL: '',
      name: 'hac-foo',
      loadScripts: ['//script1.js', '//script2.js'],
      extensions: [],
      registrationMethod: 'callback',
    };

    const result = transformScalprumManifest(manifest, {});
    expect(result).toEqual({
      ...manifest,
      baseURL: '/api/plugins/hac-foo/',
      loadScripts: ['/script1.js', '/script2.js'],
    });
  });

  it('should log error if baseURL is auto and cdnPath is not provided', () => {
    const manifest: PluginManifest = {
      version: '1.0.0',
      baseURL: 'auto',
      name: 'foo',
      loadScripts: ['/script1.js', '/script2.js'],
      extensions: [],
      registrationMethod: 'callback',
    };

    const config: ScalprumConfig = {
      foo: {
        manifestLocation: 'http://example.com/manifest.json',
        name: 'foo',
      },
    };
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    transformScalprumManifest(manifest, config);
    expect(errorSpy).toHaveBeenLastCalledWith('Manifest baseURL is set to auto but no cdnPath is provided in customProperties for plugin', 'foo');
    errorSpy.mockRestore();
  });

  it('should prefix baseURL with cdnPath for auto baseURL', () => {
    const manifest: PluginManifest = {
      version: '1.0.0',
      baseURL: 'auto',
      name: 'foo',
      loadScripts: ['script1.js', 'script2.js'],
      extensions: [],
      registrationMethod: 'callback',
    };

    const config: ScalprumConfig = {
      foo: {
        manifestLocation: 'http://example.com/manifest.json',
        name: 'foo',
        cdnPath: 'http://cdn.example.com/',
      },
    };

    const result = transformScalprumManifest(manifest, config);
    expect(result).toEqual({
      ...manifest,
      baseURL: 'http://cdn.example.com/',
      loadScripts: ['http://cdn.example.com/script1.js', 'http://cdn.example.com/script2.js'],
    });
  });

  it('should append / to cdnPath if it does not end with /', () => {
    const manifest: PluginManifest = {
      version: '1.0.0',
      baseURL: 'auto',
      name: 'foo',
      loadScripts: ['script1.js', 'script2.js'],
      extensions: [],
      registrationMethod: 'callback',
    };

    const config: ScalprumConfig = {
      foo: {
        manifestLocation: 'http://example.com/manifest.json',
        name: 'foo',
        cdnPath: 'http://cdn.example.com',
      },
    };

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = transformScalprumManifest(manifest, config);
    expect(result).toEqual({
      ...manifest,
      baseURL: 'http://cdn.example.com/',
      loadScripts: ['http://cdn.example.com/script1.js', 'http://cdn.example.com/script2.js'],
    });
    expect(warnSpy).toHaveBeenLastCalledWith('cdnPath should end with /, appending / to cdnPath');
    warnSpy.mockRestore();
  });
});
