const asyncHandler = require('express-async-handler');
const Task = require('../model/taskModel');
const TaskInfo = require('../model/taskInfoModel');

exports.getUserCharts = asyncHandler(async (req, res, next) => {
    try{ 
        let { user_id } = req.query;
        const tasks = await Task.find({ assignTo : user_id});        
        let finishedTasksBeforeDeadline = 0;
        let finishedTasksAfterDeadline = 0;
        let unFinishedTasksBeforeDeadline = 0;
        let unFinishedTasksAfterDeadline = 0;
        await Promise.all(tasks.map(async (task) => {
            const date_now = new Date();
            const date1 = new Date(task.deliveryTime);
            const date2 = new Date(task.deadline);
            date_now.setHours(0, 0, 0, 0);
            // Convert both dates to milliseconds
            const date1Ms = date1.getTime();
            const date2Ms = date2.getTime();

            if(task.isDone == true) { 
                if(date1Ms < date2Ms){
                    finishedTasksBeforeDeadline += 1;
                }else{ 
                    finishedTasksAfterDeadline += 1;
                }
            }else{
                if(date_now < date2Ms){
                    unFinishedTasksBeforeDeadline += 1;
                }else{
                    unFinishedTasksAfterDeadline += 1;
                }
            }
        }));
        res.status(200).json({ data: {finishedTasksBeforeDeadline, finishedTasksAfterDeadline, unFinishedTasksBeforeDeadline, unFinishedTasksAfterDeadline}});
    }catch(e) { 
        console.log(e)
    }
})

exports.getAdminCharts = asyncHandler(async (req, res, next) => {
    try{ 
        const tasks = await Task.find();        
        let finishedTasksBeforeDeadline = 0;
        let finishedTasksAfterDeadline = 0;
        let unFinishedTasksBeforeDeadline = 0;
        let unFinishedTasksAfterDeadline = 0;
        await Promise.all(tasks.map(async (task) => {
            const date_now = new Date();
            const date1 = new Date(task.deliveryTime);
            const date2 = new Date(task.deadline);
            date_now.setHours(0, 0, 0, 0);
            // Convert both dates to milliseconds
            const date1Ms = date1.getTime();
            const date2Ms = date2.getTime();

            if(task.isDone == true) { 
                if(date1Ms < date2Ms){
                    finishedTasksBeforeDeadline += 1;
                }else{ 
                    finishedTasksAfterDeadline += 1;
                }
            }else{
                if(date_now < date2Ms){
                    unFinishedTasksBeforeDeadline += 1;
                }else{
                    unFinishedTasksAfterDeadline += 1;
                }
            }
        }));
        res.status(200).json({ data: {finishedTasksBeforeDeadline, finishedTasksAfterDeadline, unFinishedTasksBeforeDeadline, unFinishedTasksAfterDeadline}});
    }catch(e) { 
        console.log(e)
    }
});

exports.test = asyncHandler(async (req, res, next) => {
    try{ 
        const tasks = await Task.find();     
        // res.status(200).json({ data: TaskInfo});
    }catch(e) { 
        console.log(e)
    }
});

