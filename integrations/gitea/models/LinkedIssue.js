const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LinkedIssueSchema = new Schema(
  {
    installation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Installation',
    },
    sentryIssueId: {type: String},
    sentryProjectId: {type: String},
    sentryProjectSlug: {type: String},
    sentryWebUrl: {type: String},
    giteaIssueId: {type: Number},
    giteaRepoId: {type: Number},
  },
  {timestamps: true}
);

module.exports = LinkedIssue = mongoose.model('linkedissue', LinkedIssueSchema);
