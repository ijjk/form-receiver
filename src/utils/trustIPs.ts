import fs from 'fs';
import path from 'path';
import express from 'express';
import fetch from 'node-fetch';

const { CONF_DIR = path.join(__dirname, '../../config') } = process.env;

const ips: Array<string> = require(path.join(CONF_DIR, `trustIPs.json`));
ips.push('loopback');

const cfv4 = 'https://www.cloudflare.com/ips-v4';
const cfv6 = 'https://www.cloudflare.com/ips-v6';
const cfConf = path.resolve('./config/cfIPs.json');
const refreshInterval = 24 * 60 * 60 * 1000;

const getIps = (str: string): Array<string> => {
  return str
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip.length !== 0);
};

const getCfIps = async (app: express.Application): Promise<void> => {
  const cfIps = [];
  let res = await fetch(cfv4);
  if (res.ok) {
    cfIps.push(...getIps(await res.text()));
  }
  res = await fetch(cfv6);
  if (res.ok) {
    cfIps.push(...getIps(await res.text()));
  }
  fs.writeFile(cfConf, JSON.stringify(cfIps, null, 2), err => {
    if (err) console.error(err);
  });
  app.set('trust proxy', [...ips, ...cfIps]);
};

export default (app: express.Application, cloudflare = false): void => {
  if (!cloudflare) {
    app.set('trust proxy', ips);
    return;
  }
  fs.readFile(cfConf, async (err, buff) => {
    if (err) {
      if (err.code === 'ENOENT') getCfIps(app);
      else return console.error(err);
    } else {
      const cfIps = JSON.parse(buff.toString());
      app.set('trust proxy', [...ips, ...cfIps]);
    }
    setInterval(() => getCfIps(app), refreshInterval);
  });
};
