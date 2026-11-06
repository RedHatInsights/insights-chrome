import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

it('loads a delivered catalog through a Webpack chunk without duplicating English', () => {
  const fixture = realpathSync(mkdtempSync(join(tmpdir(), 'chrome-catalog-')));
  const locales = join(fixture, 'src/locales');
  const utils = join(fixture, 'src/utils');
  const output = join(fixture, 'dist');

  try {
    mkdirSync(locales, { recursive: true });
    mkdirSync(utils, { recursive: true });
    copyFileSync(join(__dirname, 'messageCatalogs.ts'), join(locales, 'messageCatalogs.ts'));
    copyFileSync(join(__dirname, 'en.json'), join(locales, 'en.json'));
    copyFileSync(join(__dirname, '../utils/languageResolution.ts'), join(utils, 'languageResolution.ts'));
    writeFileSync(join(locales, 'zh-cn.json'), JSON.stringify({ login: '登录' }));
    writeFileSync(
      join(fixture, 'entry.js'),
      `const { messageCatalogs } = require('./src/locales/messageCatalogs');
       module.exports = messageCatalogs['zh-CN']().then(({ default: catalog }) => catalog.login);`
    );

    // Run outside Jest so its module resolver and virtual catalog mocks cannot affect the bundle.
    const translated = execFileSync(
      process.execPath,
      [
        '-e',
        String.raw`
          const webpack = require(${JSON.stringify(require.resolve('webpack'))});
          webpack({
            mode: 'production',
            target: 'node',
            context: ${JSON.stringify(fixture)},
            entry: './entry.js',
            devtool: false,
            output: {
              path: ${JSON.stringify(output)},
              filename: 'main.cjs',
              chunkFilename: '[name].cjs',
              library: { type: 'commonjs2' }
            },
            resolve: { extensions: ['.ts', '.js'] },
            module: {
              rules: [{
                test: /\.ts$/,
                use: {
                  loader: ${JSON.stringify(require.resolve('swc-loader'))},
                  options: { jsc: { parser: { syntax: 'typescript', tsx: true } } }
                }
              }]
            }
          }, (error, stats) => {
            if (error) throw error;
            if (stats.hasErrors()) throw new Error(stats.toString({ all: false, errors: true }));
            require(${JSON.stringify(join(output, 'main.cjs'))}).then(message => process.stdout.write(message));
          });
        `,
      ],
      { encoding: 'utf8', timeout: 30_000 }
    );

    expect(translated).toBe('登录');
    expect(readdirSync(output).filter((file) => file.endsWith('.cjs'))).toHaveLength(2);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}, 30_000);
