const sass = require('sass');
const path = require('path');
const nodeImporter = require('node-sass-package-importer');
const fs = require('fs');

try {
  const outFile = path.resolve(__dirname, '..', 'build', 'chrome.css');
  const outDir = path.resolve(__dirname, '..', 'build');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }
  const result = sass.renderSync({
    file: path.resolve(__dirname, '..', 'src', 'sass', 'chrome.scss'),
    importer: nodeImporter(),
  });
  fs.writeFileSync(outFile, result.css);
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
