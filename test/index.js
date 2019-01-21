import test from 'ava';
import path from 'path';
import fetch from 'node-fetch';
import getPort from 'get-port';
import { fork } from 'child_process';
import defaultConfig from '../config/config.default';
import productionConfig from '../config/config.production';

const mergedConfig = Object.assign({}, defaultConfig, productionConfig);
const serverPath = path.resolve('./dist/server.js');
const serverUrl = 'http://localhost';

const startServer = (options = {}) => {
  return fork(serverPath, [], options);
};

const didStart = (checkUrl, checkInterval, numTries = 3) => {
  let tries = 0;

  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        await fetch(checkUrl, { timeout: 500 });
        resolve();
      } catch {
        tries++;
        if (tries > numTries) reject(`failed to fetch ${checkUrl}`);
        else setTimeout(check, checkInterval);
      }
    };
    check();
  });
};

test('It starts on the correct port with default config', async t => {
  t.plan(1);

  const server = startServer();
  try {
    await didStart(`${serverUrl}:${defaultConfig.port}`, 2000);
    t.pass();
  } catch (_) {
    /* noop */
  }

  server.kill();
});

test('It starts on the correct port with production config', async t => {
  t.plan(1);

  const server = startServer({
    env: {
      NODE_ENV: 'production',
    },
  });

  try {
    await didStart(`${serverUrl}:${mergedConfig.port}`, 2000);
    t.pass();
  } catch (_) {
    /* noop */
  }

  server.kill();
});

test('It allows 2 submissions before rate limiting', async t => {
  t.plan(3);

  const port = await getPort();
  const server = startServer({
    env: {
      PORT: port,
    },
  });
  const currentUrl = `${serverUrl}:${port}`;

  try {
    await didStart(currentUrl, 2000);

    const doSubmission = async () => {
      const res = await fetch(currentUrl, {
        timeout: 7000,
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          name: 'John Deux',
          replyTo: 'twitter:_JDeux',
          message: 'Hello world',
        }),
      });
      return res.ok;
    };
    if (await doSubmission()) t.pass();
    if (await doSubmission()) t.pass();
    if ((await doSubmission()) === false) t.pass();
  } catch (_) {
    /* noop */
  }

  server.kill();
});
