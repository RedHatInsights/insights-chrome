#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
const { exec } = require('child_process');

const defaultOptions = {
  updateSnapshots: false,
};

const defaultCommand = 'npm run cypress run -- --component --browser chrome';

if (argv.u || argv.update) {
  defaultOptions.updateSnapshots = true;
}

const options = Object.entries(defaultOptions).reduce((acc, [name, val]) => `${acc} --env ${name}=${val}`, '');

const testProcess = exec(`${defaultCommand} ${options}`, (error, stdout, stderr) => {
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});

testProcess.stdout.on('data', (data) => {
  console.log(data);
});

testProcess.stdout.on('error', (data) => {
  console.error(data);
});
