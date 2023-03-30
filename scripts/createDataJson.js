/* eslint-disable @typescript-eslint/no-var-requires */
const program = require('commander');
const path = require('path');
const fs = require('fs');
const { sync: globSync } = require('glob');
const last = require('lodash/last');

let LANG_DIR = path.normalize('src/locales/');
let LANG_PATTERN = '';
let IGNORED = ['data'];

program
  .option('-p, --pattern <value>', 'file pattern')
  .option('-I, --ignore-files <value>', 'array of ignored files')
  .option('-L, --lang-pattern <value>', 'pattern to look for files with languages')
  .option('-l, --lang-dir <dir>', 'folder with languages');

const rootFolder = `${process.cwd()}/`;

program.parse(process.argv);
if (program.ignoreFiles) {
  IGNORED = program.ignoreFiles.split(',');
}

if (program.langDir) {
  LANG_DIR = program.langDir;
}

if (program.langPattern) {
  LANG_PATTERN = `${LANG_DIR}${program.langPattern}`;
} else {
  LANG_PATTERN = `${LANG_DIR}/*.json`;
}

// Merge translated json files (es.json, fr.json, etc) into one object
// so that they can be merged with the eggregated 'en' object below

const mergedTranslations = globSync(`${rootFolder}${LANG_PATTERN}`)
  .map((filename) => {
    let locale = last(filename.split('/')).split('.json')[0];
    if (locale === 'translations') {
      locale = 'en';
    }

    if (!IGNORED.includes(locale)) {
      return { [locale]: JSON.parse(fs.readFileSync(filename, 'utf8')) };
    }
  })
  .reduce((acc, localeObj) => {
    return { ...acc, ...localeObj };
  }, {});

// Merge aggregated default messages with the translated json files and
// write the messages to this directory
fs.writeFileSync(`${rootFolder}${LANG_DIR}data.json`, JSON.stringify(mergedTranslations, null, 2));
