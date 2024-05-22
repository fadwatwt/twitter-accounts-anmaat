const asyncHandler = require('express-async-handler');
const Notification = require('../model/notificationModel');


exports.createNotification = asyncHandler(async (req, res, next) => {
    try{
        const notification = await Notification.create({
            user_id: req.body.user_id,
            type: req.body.type,
            notification: req.body.notification,
            seen: '0',
          });
        res.status(200).json({ data: notification });
    }catch(e){ 
        console.log(e)
    }
});

exports.getNotifications = asyncHandler(async (req , res, next) => { 
    try{ 
        const user_id = req.params.user_id;
        //  await Notification.deleteMany({});
        const notifications = await Notification.find({ user_id: user_id });
        res.status(200).json({notifications});
    }catch(e){
        console.log(e);
    } 
});

exports.reedNotifications = asyncHandler(async (req , res ,next) => { 
    try { 
        const user_id = req.params.user_id;
        const notifications = await Notification.find({ user_id: user_id });
        await Promise.all(notifications.map(async (notification) => {
            await Notification.updateOne(
                { _id: notification._id },
                { $set: { seen: '1' } }
              );
        }));

        res.status(200).json({notifications});
    }catch(e){
        console.log(e);
    }
})
