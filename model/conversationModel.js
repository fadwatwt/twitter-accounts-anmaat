//conversation
const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    name: { 
        type: String,
    },
    members: {
      type: Array(),
    },
    type: { 
      type: String
    },
    date: { 
        type: Date
    }
  },
  { timestamps: true }
);

const Conversation = mongoose.model('conversation', ConversationSchema);

module.exports = Conversation;
