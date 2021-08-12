const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingsSchema = new Schema(
  {
    installation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Installation',
    },
    'comments-sync': {type: Boolean, default: true},
  },
  {timestamps: true}
);

module.exports = Settings = mongoose.model('settings', SettingsSchema);
