import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import themeBootstrap from '../config/theme-bootstrap';
import { THEME_STORAGE_KEY } from './utils/consts';

const templates = ['index.ejs', 'indexRes.ejs'] as const;
const themeClasses = ['pf-v6-theme-felt', 'pf-v6-theme-glass'];

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

  it.each(['/lightwell', '/lightwell/repositories'])('applies the Lightwell PatternFly themes on %s', (pathname) => {
    window.history.replaceState({}, '', pathname);

    runThemeBootstrap(templateName);

    themeClasses.forEach((themeClass) => {
      expect(document.documentElement).toHaveClass(themeClass);
    });
  });

  it('does not apply the Lightwell themes on other routes', () => {
    window.history.replaceState({}, '', '/insights/dashboard');

    runThemeBootstrap(templateName);

    themeClasses.forEach((themeClass) => {
      expect(document.documentElement).not.toHaveClass(themeClass);
    });
  });

  it('combines the Lightwell themes with a saved dark theme', () => {
    window.history.replaceState({}, '', '/lightwell');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    runThemeBootstrap(templateName);

    expect(document.documentElement).toHaveClass('pf-v6-theme-dark', ...themeClasses);
  });

  it('applies the Lightwell themes when storage is unavailable', () => {
    window.history.replaceState({}, '', '/lightwell');
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    try {
      runThemeBootstrap(templateName);
    } finally {
      getItem.mockRestore();
    }

    expect(document.documentElement).toHaveClass(...themeClasses);
  });
});
