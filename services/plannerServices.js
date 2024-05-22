const asyncHandler = require('express-async-handler');
const Task = require('../model/taskModel');

exports.getTasks = asyncHandler(async (req, res, next) => {
    try{ 
        let { date } = req.query;
        date = new Date(date).toISOString();
        console.log(date);
        const tasks = await Task.find({ assignOn : date});       
        console.log(tasks);
        res.status(200).json({ data: tasks , date: date});
    }catch(e) { 
        console.log(e)
    }
})

exports.getUsersTasks = asyncHandler(async (req, res, next) => {
    try{ 
        let { date } = req.query;
        const user_id = req.params.user_id;
        date = new Date(date);
        const tasks = await Task.find({assignTo: user_id ,assignOn : date});        
        res.status(200).json({ data: tasks , date: date});
    }catch(e) { 
        console.log(e)
    }
})

