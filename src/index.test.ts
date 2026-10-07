import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import themeBootstrap from '../config/theme-bootstrap';
import { THEME_STORAGE_KEY } from './utils/consts';

const templates = ['index.ejs', 'indexRes.ejs'] as const;
const lightwellOnlyClasses = ['pf-v6-theme-glass'];
const feltClass = 'pf-v6-theme-felt';

const getBootstrapScript = (template: string): string => {
  const match = template.match(/<script type="text\/javascript">\s*([\s\S]*?)\s*<\/script>/);
  if (!match) {
    throw new Error('Theme bootstrap script not found');
  }
  expect(match[1].trim()).toBe('<%= themeBootstrap %>');
  return themeBootstrap;
};

const runThemeBootstrap = (templateName: (typeof templates)[number]) => {
  const template = readFileSync(resolve(__dirname, templateName), 'utf8');
  const script = getBootstrapScript(template);
  const executeScript = new Function('window', 'document', 'localStorage', script);
  executeScript(window, document, localStorage);
};

describe.each(templates)('initial theme bootstrap in %s', (templateName) => {
  beforeEach(() => {
    document.documentElement.className = '';
    localStorage.clear();
  });

  it('applies Felt theme on all routes before PF CSS loads', () => {
    window.history.replaceState({}, '', '/insights/dashboard');

    runThemeBootstrap(templateName);

    expect(document.documentElement).toHaveClass(feltClass);
    lightwellOnlyClasses.forEach((themeClass) => {
      expect(document.documentElement).not.toHaveClass(themeClass);
    });
  });

  it.each(['/lightwell', '/lightwell/repositories'])('applies Felt and Glass themes on %s', (pathname) => {
    window.history.replaceState({}, '', pathname);

    runThemeBootstrap(templateName);

    expect(document.documentElement).toHaveClass(feltClass);
    lightwellOnlyClasses.forEach((themeClass) => {
      expect(document.documentElement).toHaveClass(themeClass);
    });
  });

  it('combines Felt with a saved dark theme on non-Lightwell routes', () => {
    window.history.replaceState({}, '', '/insights/dashboard');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    runThemeBootstrap(templateName);

    expect(document.documentElement).toHaveClass('pf-v6-theme-dark', feltClass);
  });

  it('combines the Lightwell themes with a saved dark theme', () => {
    window.history.replaceState({}, '', '/lightwell');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    runThemeBootstrap(templateName);

    expect(document.documentElement).toHaveClass('pf-v6-theme-dark', feltClass, ...lightwellOnlyClasses);
  });

  it('applies Felt theme when storage is unavailable', () => {
    window.history.replaceState({}, '', '/insights/dashboard');
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    try {
      runThemeBootstrap(templateName);
    } finally {
      getItem.mockRestore();
    }

    expect(document.documentElement).toHaveClass(feltClass);
  });

  it('applies Lightwell themes when storage is unavailable', () => {
    window.history.replaceState({}, '', '/lightwell');
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    try {
      runThemeBootstrap(templateName);
    } finally {
      getItem.mockRestore();
    }

    expect(document.documentElement).toHaveClass(feltClass, ...lightwellOnlyClasses);
  });
});
