const asyncHandler = require('express-async-handler');
const Conversation = require('../model/conversationModel');
const User = require('../model/userModel');
const Message = require('../model/messageModel');
const Task = require('../model/taskModel');
const multer = require('multer');
const path = require('path');
const { io,getUserSocket } = require('../server'); // تأكد من أنك تقوم باستيراد io و users بشكل صحيح

exports.createChat = asyncHandler(async (req, res, next) => {
    try {
        const { name, members, type, date } = req.body;

        // Check if a conversation with the same members already exists
        let conversation = await Conversation.findOne({
            members: { $all: members, $size: members.length },
            type: type // Optionally, ensure the type matches too if needed
        });

        if (conversation) {
            return res.status(200).json({message: 'المحادثة موجودة بالفعل' });
        }

        // Create a new conversation if not exists
        conversation = await Conversation.create({
            name,
            members,
            type,
            date
        });

        res.status(200).json({ data: conversation, message: 'تم انشاء المحادثة بنجاح' });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: 'حدث خطأ ما' });
    }
});


exports.createMeeting = asyncHandler(async (req, res, next) => {
    try {
        const { name, members, type, date } = req.body;

        // Check if a conversation with the same members already exists
        // let conversation = await Conversation.findOne({
        //     members: { $all: members, $size: members.length },
        //     type: type // Optionally, ensure the type matches too if needed
        // });
        //
        // if (conversation) {
        //     return res.status(200).json({message: 'الاجتماع موجودة بالفعل' });
        // }

        // Create a new conversation if not exists
        const conversation = await Conversation.create({
            name,
            members,
            type,
            date
        });
        res.status(200).json({ data: conversation, message: 'تم انشاء الاجتماع بنجاح' });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: 'حدث خطأ ما' });
    }
});

exports.getConversations = async (req, res, next) => {
    try {
        const user_id = req.params.user_id;
        const conversations = await Conversation.find({ members: { $in: [user_id] } });

        const chats = [];
        const meetings = [];

        await Promise.all(conversations.map(async (conversation) => {
            const messages = await Message.find({ chat_id: conversation._id });
            let unseenCount = 0;

            if (conversation.type === 'chat') {
                const otherUserId = conversation.members.find(member => member !== user_id);
                const user = await User.findOne({ _id: otherUserId });

                if (user) {
                    conversation.name = user.name;

                    messages.forEach((message) => {
                        if (!message.seen.includes(user_id)) {
                            unseenCount += 1;
                        }
                    });

                    conversation.__v = unseenCount;
                    chats.push(conversation);
                } else {
                    // Handle the case where the user is not found
                    conversation.name = "Unknown User";
                    conversation.__v = unseenCount;
                    chats.push(conversation);
                }
            } else {
                messages.forEach((message) => {
                    if (!message.seen.includes(user_id)) {
                        unseenCount += 1;
                    }
                });

                conversation.__v = unseenCount;
                meetings.push(conversation);
            }
        }));

        res.status(200).json({ chats, meetings });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
};



exports.getConversation = asyncHandler(async (req , res, next) => { 
    try { 
        
        const { page, limit, user_id } = req.query;
        const skip = (page - 1) * limit;
        const chat_id = req.params.chat_id;

        let chat = await Message.find({chat_id : chat_id}).sort({_id : -1}).skip(skip).limit(20).exec();
        chat = chat.slice().reverse();

        const messages = await Message.find({chat_id : chat_id});
        await Promise.all(messages.map(async (message) => {
                const seen = message.seen.find(se => se === user_id);
                if(!seen){ 
                    await Message.updateOne(
                        { _id: message._id },
                        { $push: { seen: user_id } },
                    );
                }
        }));
        const conversation = await Conversation.findOne({ _id: chat_id});
        let name = '';
        if(conversation.type == 'chat'){ 
            if(conversation.members[0] === user_id) {
                const user = await User.findOne({_id : conversation.members[1]});
                name = user.name;
            }else{ 
                const user = await User.findOne({_id : conversation.members[0]});
                name = user.name;
            }
        }else{ 
            name = conversation.name;
        }
        res.status(200).json({ data: chat , name : name});
    }catch(e){
        console.log(e);
    }

});

exports.createMessage = asyncHandler(async (req, res, next) => {
    try{
        if(req.files) { 
                await Promise.all(req.files.map(async (file) => {
                let type = 0;
                if (file.mimetype.startsWith('image')) {
                  type = 1;
                } else if (file.mimetype.startsWith('video')) {
                  type = 3;
                } else if (file.mimetype.startsWith('text')) {
                  type = 2
                } else {
                  return next(new ApiError(`نوع الملف غير مدعوم`, 404));
                }

                file.type = type;
            
              await Message.create({
              chat_id: req.body.chat_id,
              sender_id: req.body.sender_id,
              message: file.filename,
              type: type,
              seen: [req.body.sender_id],
            });
        }));  
        }
        const message = await Message.create({
            chat_id: req.body.chat_id,
            sender_id: req.body.sender_id,
            message: req.body.message,
            seen: [req.body.sender_id],
          });
        res.status(200).json({ data: message  , files: req.files});
    }catch(e){ 
        console.log(e)
    }
});

exports.getConversationUsers = asyncHandler(async (conversation_id) => { 
    const conversation = Conversation.findOne({_id : conversation_id});
    const data = await conversation;
    return data.members;
})

exports.getUnreadMessages = asyncHandler(async (req , res, next) => { 
    const user_id = req.params.user_id;
    const conversations = await Conversation.find({ members: {$in : [user_id]} });
    const messages_array = [];
    await Promise.all(conversations.map(async (conversation) => {
        const messages = await Message.find({chat_id: conversation._id});
        if(conversation.type == 'chat') { 
            if(conversation.members[0] === user_id) {
                const user = await User.findOne({_id : conversation.members[1]});
                
                await Promise.all(messages.map(async (message) => {
                    const seen = message.seen.find(se => se === user_id);
                    if(!seen) {
                        const newMessage = Object.assign({}, {}, message);
                        newMessage._doc.chat_name = user.name;
                        messages_array.push(newMessage._doc);
                        
                    }
                }));
            }else{ 
                const user = await User.findOne({_id : conversation.members[0]});
                await Promise.all(messages.map(async (message) => {
                    const seen = message.seen.find(se => se === user_id);
                    if(!seen) {
                        const newMessage = Object.assign({}, {}, message);
                        newMessage._doc.chat_name = user.name;
                        messages_array.push(newMessage._doc);
                    }

                }));
            }
        }else{ 
            await Promise.all(messages.map(async (message) => {
                const seen = message.seen.find(se => se === user_id);
                if(!seen) {
                    const newMessage = Object.assign({}, {}, message);
                    newMessage._doc.chat_name = name;
                    messages_array.push(newMessage._doc);
                }

            }));
        }
    }));
    console.log(messages_array);
    res.status(200).json({data : messages_array });
})

exports.SetReadMessages = asyncHandler(async (req, res, next) => {
    const user_id = req.params.user_id;
    const chat_id = req.query.chat_id;

    const messages = await Message.find({chat_id : chat_id});
    await Promise.all(messages.map(async (message) => {
            const seen = message.seen.find(se => se === user_id);
            if(!seen){ 
                await Message.updateOne(
                    { _id: message._id },
                    { $push: { seen: user_id } },
                );
            }
    }));
 })


 exports.getPerformRate = asyncHandler(async (req, res, next) => {
    try{
        const user_id  = req.params.user_id;
        const finalMessages = await this.calculateResponseTimeRatingToMessages(user_id);
        // const finalTaskRating = await this.calculateResponseTimeRatingToTask(user_id);
        res.status(200).json({data : finalMessages });
    }catch(e){ 
        console.log(e)
    }
});

exports.calculateResponseTimeRatingToTask = async (user_id) => { 

}

exports.calculateResponseTimeRatingToMessages = async (user_id) => { 
    const conversations = await Conversation.find({ members: {$in : [user_id]} });
    let times = [];
    await Promise.all(conversations.map(async (conversation) => { 
        const messages = await Message.find({chat_id: conversation._id});
        for (let i = 0; i < messages.length; i++) {
            if(messages[i].sender_id == user_id) {
            const currentTime = messages[i].createdAt;
            let prevTime = currentTime;
            if(messages[i - 1] && messages[i - 1].sender_id != user_id) { 
                prevTime = messages[i - 1].createdAt;
            }
            const finalTime = Math.floor((currentTime - prevTime) / 1000);

            times.push(finalTime);
          }
        }
    }));

    let timeCount = 0;
    times.forEach(time => {
        timeCount += time;
    });
    const finalTime = timeCount / times.length ;
    return this.calculateResponseTimeRating(finalTime);
}

exports.calculateResponseTimeRating = (averageResponseTime) => {
    // Define rating thresholds (adjust these based on your desired scale)
    const excellentThreshold = 60 * 5; // 5 minutes (excellent response time)
    const goodThreshold = 60 * 15; // 15 minutes (good response time)
    const averageThreshold = 60 * 30; // 30 minutes (average response time)
    const fairThreshold = 60 * 60; // 1 hour (fair response time)
    const poorThreshold = Infinity; // Any time greater than 1 hour (poor response time)
  
    // Assign rating based on thresholds
    let rating;
    if (averageResponseTime < excellentThreshold) {
      rating = 5;
    } else if (averageResponseTime < goodThreshold) {
      rating = 4;
    } else if (averageResponseTime < averageThreshold) {
      rating = 3;
    } else if (averageResponseTime < fairThreshold) {
      rating = 2;
    } else {
      rating = 1;
    }
  
    return rating;
  }