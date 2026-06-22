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