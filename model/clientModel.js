//emloyee data
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'email required'],
      unique: true,
      lowercase: true,
    },
    macAddress: {
      type: String,
      length: [12, 'Invalid mac address length'],
      unique: true,
    },
    Serial: {
      type: String,
      unique: true,
    },

    active: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Client = mongoose.model('client', clientSchema);

module.exports = Client;
