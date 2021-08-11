// Require express
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
// Initialize express and define a port
const app = express();

const PORT = process.env.PORT || 7500;

// const mongoURI = 'mongodb://root:password@localhost:27017/db';

const SENTRY_TOKEN = 'bd99f6294ae34eda89b7ff3c8065edb63fd7b34c4e0f4b1e8ac0a8a370e50491';
const CLIENT_SECRET = '096a2843571d49009b665f986852847cba1900ad938048a29dfba4b639ea63ac';

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
