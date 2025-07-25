#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const { spawn, execSync } = require('child_process');
const waitOn = require('wait-on');

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
  child = spawn('npm', ['run', 'dev:beta'], {
    stdio: [process.stdout, process.stdout, process.stdout],
    detached: false,
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

  console.log('HTTP Proxy val', { px: process.env.HTTP_PROXY });
  await waitOn(options);
  execSync(`cat /etc/hosts`, {
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  execSync(`cat /proc/net/tcp | grep 539`, {
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  execSync(`curl -k https://stage.foo.redhat.com:1337`, {
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  execSync(`curl -k https://0.0.0.0:1337`, {
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  execSync(`NO_COLOR=1 E2E_USER=${process.env.CHROME_ACCOUNT} E2E_PASSWORD=${process.env.CHROME_PASSWORD} npx playwright test`, {
    encoding: 'utf-8',
    stdio: 'inherit',
  });
}

runTests()
  .then(() => {
    child.kill();
    process.exit(0);
  })
  .catch((error) => {
    console.log('e2e test failed!', error);
    child.kill();
    process.exit(1);
  });
