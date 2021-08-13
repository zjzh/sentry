const Installation = require('../models/Installation');
const LinkedIssue = require('../models/LinkedIssue');
const Settings = require('../models/Settings');

const GiteaApiClient = require('../clients/gitea');

const handleSentryWebhookResources = async (resource, action, data, installationId) => {
  let install = await Installation.findOne({sentryInstallationId: installationId});
  let settings = await Settings.findOne({installation: install._id});
  switch (resource) {
    case 'comment':
      if (settings['comments-sync']) {
        return await handleSentryCommentWebhook(action, data['comment'], installationId);
      }
      return;
    default:
      return;
  }
};

const handleSentryCommentWebhook = async (action, data, installationId) => {
  try {
    let install = await Installation.findOne({sentryInstallationId: installationId});
    let linkedIssue = await LinkedIssue.findOne({
      installation: install._id,
      sentryIssueId: data.data.groupId,
    });
    const client = new GiteaApiClient(install.giteaAuthToken);
    switch (action) {
      case 'created':
        let repository = await client.fetchRepoById(linkedIssue.giteaRepoId);
        let comment = await client.createIssueComment(
          repository.data.full_name,
          linkedIssue.giteaIssueId,
          {body: `${data.data.text} [Sentry](${linkedIssue.sentryWebUrl}activity/)`}
        );
        return comment;
      default:
        return;
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = handleSentryWebhookResources;
