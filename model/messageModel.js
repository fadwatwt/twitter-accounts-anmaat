const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const MessageSchema = new mongoose.Schema(
  {
    chat_id: {
        type: mongoose.Schema.Types.ObjectId,
    },
    sender_id: { 
        type: mongoose.Schema.Types.ObjectId,
    },
    message: { 
        type: String
    },
    type: {
      type: String,
      enum: [0, 1, 2, 3],
      default: 0,
    },
    // 0 => text , 1 => image , 2 => file , 3 => video
    seen: { 
      type: Array()
    }
  },
  { timestamps: true }
);


MessageSchema.plugin(mongoosePaginate);
const Message = mongoose.model('message', MessageSchema);

module.exports = Message;
