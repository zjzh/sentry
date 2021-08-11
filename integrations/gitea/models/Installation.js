const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InstallationSchema = new Schema(
  {
    installationId: {
      type: String,
      required: true,
    },
    authToken: {type: String, required: true},
    refreshToken: {type: String, required: true},
  },
  {timestamps: true}
);

module.exports = Installation = mongoose.model('installation', InstallationSchema);
