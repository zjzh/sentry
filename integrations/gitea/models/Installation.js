const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InstallationSchema = new Schema(
  {
    sentryInstallationId: {
      type: String,
    },
    sentryAuthToken: {type: String},
    sentryRefreshToken: {type: String},
    status: {type: String, enum: ['pending', 'installed'], default: 'pending'},
    giteaAuthToken: {type: String},
    giteaRefreshToken: {type: String},
  },
  {timestamps: true}
);

module.exports = Installation = mongoose.model('installation', InstallationSchema);
