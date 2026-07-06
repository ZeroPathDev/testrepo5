const express = require('express');
const axios = require('axios');
const { URL } = require('url');
const dns = require('dns').promises;
const app = express();


function isPrivateIp(ip) {
    return ip === '::1' ||
      /^127\./.test(ip) ||
      /^10\./.test(ip) ||
      /^192\.168\./.test(ip) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
      ip.startsWith('fc') || ip.startsWith('fd') ||
      ip.startsWith('fe80:');
  }

app.get('/', (req, res) => {
    res.send('Hello World');
});


app.get('/fetch', async (req, res) => {
    const url = req.query.url;
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return res.status(400).send('Invalid URL');
    }
    const hostname = parsedUrl.hostname;
    if (!['http:', 'https:'].includes(parsedUrl.protocol) ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        /^(10|127)\./.test(hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
        /^192\.168\./.test(hostname)) {
      return res.status(400).send('URL not allowed');
    }
    try {
      // Resolve once and pin the request to the validated address to avoid DNS rebinding TOCTOU.
      const addresses = await dns.lookup(parsedUrl.hostname, { all: true });
      for (const { address } of addresses) {
        if (isPrivateIp(address)) {
          return res.status(400).send('URL not allowed');
        }
      }

      const [firstAddress] = addresses;
      if (!firstAddress || !firstAddress.address) {
        return res.status(400).send('Invalid hostname');
      }

      const lookup = (_hostname, _options, callback) => {
        callback(null, firstAddress.address, firstAddress.family);
      };

      const resp = await axios.get(url, {
        lookup,
        maxRedirects: 0,
      });
      res.send(resp.data);
    } catch (e) {
      return res.status(400).send(e.message);
    }
  });