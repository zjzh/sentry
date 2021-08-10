// Require express
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
// Initialize express and define a port
const app = express();

const PORT = process.env.PORT || 7500;

// const mongoURI = 'mongodb://root:password@localhost:27017/db';

const SENTRY_TOKEN = '56a00ab0c4f04d809d7fb1ec42f775b068e2bff274d3463091636dc13b407b80';
const CLIENT_SECRET = '633c49554d0841fa99481e6cfb86d44051696d5ac85041948da17c7fb4219e01';

axios.defaults.headers.common.Authorization = 'Bearer ' + SENTRY_TOKEN;

function verifySignature(request, secret = '') {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(request.body), 'utf8');
    const digest = hmac.digest('hex');
    return digest === request.headers['sentry-hook-signature'];
  } catch (error) {
    console.log({error});
    return error;
  }
}

app.use(express.json());

app.get('/', async (req, res) => {
  res.send('HELLO WORLD');
});

app.post('/hook', async (req, res) => {
  console.log(req.headers['sentry-hook-signature']);
  if (!verifySignature(req, CLIENT_SECRET)) {
    console.log('failed to hash');
    return res.status(401).send('bad signature');
  }

  // Identify the type of req (in our case, new issues)
  const resource = req.get('sentry-hook-resource');
  const {action} = req.body;
  console.log({resource, action}, req.body);

  res.status(200).send('ok');
});

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
