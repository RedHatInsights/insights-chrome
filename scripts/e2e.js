#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const { spawn, execSync } = require('child_process');
const waitOn = require('wait-on');

function execSyncWrapper(command) {
  try {
    execSync(command, {
      encoding: 'utf-8',
      stdio: 'inherit',
    });
  } catch (e) {
    console.log('Error while running command, output follows:');
    console.log(e);
  }
}

const options = {
  resources: ['https://stage.foo.redhat.com:1337/webpack-dev-server'],
  delay: 6000,
  interval: 3000, // wait for 3 sec
  validateStatus: function (status) {
    console.log({ status });
    return status >= 200 && status < 300; // default if not provided
  },
  verbose: true,
};
let child;
async function runTests() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  process.env.DISABLE_CLIENT_OVERLAY = 'true';
  child = spawn('npm', ['run', 'dev:beta'], {
    stdio: [process.stdout, process.stdout, process.stdout],
    // try to prevent dev server from becoming a zombie
    detached: true,
  });

  child.on('close', (code) => {
    console.log(`Dev server closed ${code}`);
  });

  child.on('exit', (code) => {
    console.log(`Dev server exited ${code}`);
  });

  child.on('error', (err) => {
    console.log(`Dev server error ${err}`);
  });

  child.on('disconnect', () => {
    console.log('Dev server disconnect');
  });

  child.on('spawn', () => {
    console.log('Dev server spawned');
  });

  console.log('HTTP Proxy val', { px: process.env.HTTP_PROXY });
  await waitOn(options);
  execSyncWrapper(`NO_COLOR=1 E2E_USER=${process.env.CHROME_ACCOUNT} E2E_PASSWORD=${process.env.CHROME_PASSWORD} npx cypress run --e2e`);
}

runTests()
  .then(() => {
    console.log('Post-test: Killing the child process');
    child.kill();
    process.exit(0);
  })
  .catch((error) => {
    console.log('e2e test failed!', error);
    child.kill();
    process.exit(1);
  });
