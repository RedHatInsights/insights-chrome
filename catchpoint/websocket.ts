// Paste this entire file into a Catchpoint Playwright test. It uses plain JavaScript syntax.
// Catchpoint provides `page`, `expect`, and `Catchpoint`; credentials stay in its credential store.
const CONFIG = {
  // For stage use https://console.stage.redhat.com and configure Squid in Catchpoint (see README).
  consoleUrl: 'https://console.redhat.com',
  dashboardPath: '/insights/dashboard',
  socketPath: '/wss/chrome-service/v1/ws',
  protocol: 'cloudevents.json',
  authTimeout: 90000,
  connectTimeout: 15000,
  holdOpenTime: 10000,
  // Optional: use the token of a configured Catchpoint Insight tracepoint.
  resultTracepoint: '',
};

if (CONFIG.resultTracepoint) await Catchpoint.setTracepoint(CONFIG.resultTracepoint, 'NOT COMPLETED: login or WebSocket check has not finished.');
await Catchpoint.startStep('Log in to Console');
const username = await Catchpoint.username();
const password = await Catchpoint.password();
if (!username || !password) throw new Error('Configure a username and password for the target environment in Catchpoint.');

// Matches the consent suppression used by our shared Playwright authentication helper.
await page.route('**/consent.trustarc.com/**', (route) => route.abort());
await page.goto(new URL(CONFIG.dashboardPath, CONFIG.consoleUrl).href, { waitUntil: 'domcontentloaded', timeout: CONFIG.authTimeout });
const userMenu = page.getByRole('button', { name: /User Avatar/ });
const usernameInput = page.locator('input[name="username"]:visible').first();
const lockdown = page.getByText('Lockdown', { exact: false }).first();
await usernameInput.or(userMenu).or(lockdown).first().waitFor({ state: 'visible', timeout: CONFIG.authTimeout });
if (await lockdown.isVisible()) throw new Error('Lockdown page detected. Check the Catchpoint node and Squid proxy configuration for this environment.');

// SSO can return an already authenticated session without displaying a login form.
if (!(await userMenu.isVisible())) {
  await usernameInput.fill(username);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByLabel('Password', { exact: true }).fill(password, { timeout: CONFIG.authTimeout });
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
}
await userMenu.waitFor({ state: 'visible', timeout: CONFIG.authTimeout });

await Catchpoint.startStep('Verify authenticated WebSocket availability');
const result = await page.evaluate(async (config) => {
  // Keep the probe on the configured origin so the browser supplies its scoped cs_jwt cookie.
  if (location.origin !== new URL(config.consoleUrl).origin) throw new Error('Login did not return to the configured Console origin.');
  const socketUrl = new URL(config.socketPath, location.origin);
  socketUrl.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';

  const result = { passed: false, message: 'WebSocket probe did not complete.' };
  await new Promise((resolve) => {
    const socket = new WebSocket(socketUrl.href, config.protocol);
    let holdTimer = 0;
    let finished = false;
    const connectTimer = window.setTimeout(() => fail('WebSocket did not open before the connection timeout.'), config.connectTimeout);

    const cleanup = () => {
      window.clearTimeout(connectTimer);
      window.clearTimeout(holdTimer);
      socket.onopen = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    };
    const fail = (message = 'WebSocket connection failed.') => {
      if (finished) return;
      finished = true;
      cleanup();
      result.message = message;
      resolve(false);
    };

    socket.onerror = () => fail('WebSocket connection failed. Check the handshake in Catchpoint network results.');
    socket.onclose = (event) => fail(`WebSocket closed before the observation period finished (code ${event.code}).`);
    socket.onopen = () => {
      window.clearTimeout(connectTimer);
      if (socket.protocol !== config.protocol) {
        fail('WebSocket did not negotiate the expected CloudEvents protocol.');
        return;
      }
      holdTimer = window.setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          fail('WebSocket was no longer open at the end of the observation period.');
          return;
        }
        finished = true;
        result.passed = true;
        result.message = `Negotiated ${socket.protocol} and stayed open for ${config.holdOpenTime / 1000} seconds.`;
        cleanup();
        resolve(true);
      }, config.holdOpenTime);
    };
  });
  return result;
}, CONFIG);

const outcome = `${result.passed ? 'PASS' : 'FAIL'}: ${result.message}`;
await Catchpoint.startStep(`WebSocket result - ${result.passed ? 'PASS' : 'FAIL'}`);
if (CONFIG.resultTracepoint) await Catchpoint.setTracepoint(CONFIG.resultTracepoint, outcome);
// Assert in the monitor runner, not only inside the page's JavaScript execution.
expect(result.passed, outcome).toBe(true);
