// Require express
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const morgan = require('morgan');
const handleSentryWebhookResources = require('./webhooks/sentry');
// Initialize express and define a port
const app = express();

const PORT = process.env.PORT || 7500;

const SentryApiClient = require('./clients/sentry');
const GiteaApiClient = require('./clients/gitea');

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {useNewUrlParser: true})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const Installation = require('./models/Installation');
const Settings = require('./models/Settings');
const LinkedIssue = require('./models/LinkedIssue');

app.use(morgan('combined'));
app.use(express.json());

app.get('/', async (req, res) => {
  try {
    res.send('HELLO WORLD');
  } catch (error) {
    console.log(error);
  }
});

app.get('/setup', async (req, res) => {
  try {
    const client = new SentryApiClient();
    let {code, installationId, orgSlug} = req.query;
    let resp = await client.setupInstallation(installationId, code);
    let data = resp.data;
    let token = data['token'];
    let refreshToken = data['refreshToken'];
    // store the installationId, token and refreshToken in DB
    const install = new Installation({
      sentryInstallationId: installationId,
      sentryAuthToken: token,
      sentryRefreshToken: token,
    });
    await install.save();
    const giteaClient = new GiteaApiClient();
    let url = giteaClient.generateRedirectUri(JSON.stringify({installationId, orgSlug}));
    return res.redirect(url);
    // ;
  } catch (error) {
    console.log(JSON.stringify(error));
  }
});

app.get('/gitea/setup', async (req, res) => {
  try {
    let {code, state} = req.query;
    console.log('state: ', state);
    let giteaClient = new GiteaApiClient();
    let resp = giteaClient.authorizeOauth(code);
    let data = resp.data;
    console.log(data);

    let {installationId, orgSlug} = JSON.parse(state);
    console.log({installationId, orgSlug});
    let install = await Installation.findOneAndUpdate(
      {sentryInstallationId: installationId},
      {
        giteaAuthToken: data['access_token'],
        giteaRefreshToken: data['refresh_token'],
      },
      {new: true}
    );
    console.log('install', install);
    const sentryClient = new SentryApiClient(install.sentryAuthToken);
    await sentryClient.verifyInstallation(installationId);
    install.status = 'installed';
    await install.save();
    console.log(install);

    return res.redirect(`http://localhost:8000/settings/${orgSlug}/sentry-apps/gitea/`);
  } catch (error) {
    console.log(error);
  }
});

app.post('/hook', async (req, res) => {
  if (!new SentryApiClient().verifySignature(req)) {
    console.log('failed to hash');
    return res.status(401).send('bad signature');
  }

  // Identify the type of req (in our case, new issues)
  const resource = req.get('sentry-hook-resource');
  const {
    action,
    data,
    installation: {uuid},
  } = req.body;

  await handleSentryWebhookResources(resource, action, data, uuid);
  res.status(200).send('ok');
});

app.get('/sentry/issues/gitea/assignees', async (req, res) => {
  try {
    const {installationId} = req.query;
    let install = await Installation.findOne({
      sentryInstallationId: installationId,
    }).lean();
    let client = new GiteaApiClient(install.giteaAuthToken);
    let users = await client.fetchAllUsers();
    let formatted = users.data.map(user => ({
      value: user.username,
      label: user.username,
    }));
    res.json(formatted);
  } catch (error) {
    console.log(error);
  }
});

app.get('/sentry/issues/gitea/repos', async (req, res) => {
  try {
    const {installationId} = req.query;
    let install = await Installation.findOne({
      sentryInstallationId: installationId,
    }).lean();
    let client = new GiteaApiClient(install.giteaAuthToken);
    let repos = await client.fetchAllRepos();
    let formatted = repos.data.map(repo => ({value: repo.id, label: repo.full_name}));
    res.json(formatted);
  } catch (error) {
    console.log(error);
  }
});

app.post('/sentry/issues/create', async (req, res) => {
  try {
    const {
      fields: {title, description, repo, assignee},
      installationId,
      issueId,
      webUrl,
      project,
    } = req.body;
    let install = await Installation.findOne({
      sentryInstallationId: installationId,
    }).lean();
    let client = new GiteaApiClient(install.giteaAuthToken);
    let repository = await client.fetchRepoById(repo);
    let payload = {
      title,
      body: description,
      assignees: [assignee],
    };
    let issue = await client.createIssue(repository.data.full_name, payload);

    let linkedIssue = new LinkedIssue({
      installation: install._id,
      sentryIssueId: issueId,
      sentryProjectId: project.id,
      sentryProjectSlug: project.slug,
      sentryWebUrl: webUrl,
      giteaIssueId: issue.data.id,
      giteaRepoId: repo,
    });
    await linkedIssue.save();

    res.json({
      webUrl: issue.data.html_url.toString(),
      project: issue.data.repository.full_name.toString(),
      identifier: issue.data.id.toString(),
    });
  } catch (error) {
    console.log(error);
  }
});

app.get('/sentry/configuration/settings', async (req, res) => {
  const {installationId} = req.query;
  let install = await Installation.findOne({sentryInstallationId: installationId});
  let settings = await Settings.findOneAndUpdate(
    {installation: install._id},
    {installation: install._id, 'comments-sync': true},
    {upsert: true, new: true}
  )
    .select({'comments-sync': 1, _id: 0})
    .lean();
  return res.json(settings);
});

app.post('/sentry/configuration/settings', async (req, res) => {
  try {
    const {fields, installationId} = req.body;
    let install = await Installation.findOne({sentryInstallationId: installationId});
    let settings = await Settings.findOneAndUpdate({installation: install._id}, fields, {
      new: true,
    })
      .select({'comments-sync': 1, _id: 0})
      .lean();
    return res.json(settings);
  } catch (error) {
    console.log(error);
  }
});

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
