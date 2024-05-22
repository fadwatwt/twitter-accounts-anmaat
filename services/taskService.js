const factory = require('./handlersFactory');
const Job = require('../model/taskModel');
const TaskCard = require('../model/taskCardModel');
const asyncHandler = require('express-async-handler');


// @desc    Get list of jobs
// @route   GET /api/v1/jobs
// @access  Private
exports.getJobs = factory.getAll(Job);

// @desc    Get specific job by id
// @route   GET /api/v1/jobs/:id
// @access  Private
exports.getJob = factory.getOne(Job);

// @desc    Create Job
// @route   POST  /api/v1/jobs
// @access  Private/Admin
exports.createJob = factory.createOne(Job);

// @desc    Update specific Job
// @route   PUT /api/v1/jobs/:id
// @access  Private/Admin
exports.updateJob = factory.updateOne(Job);

// @desc    Delete specific Job
// @route   DELETE /api/v1/jobs/:id
// @access  Private/Admin
exports.deleteJob = factory.deleteOne(Job);
/////delete set of tesks
// @route   POST /api/v1/tasks/delete
// @access  Private
exports.deleteManyTasks = factory.deleteMany(Job);

exports.taskDelivery = asyncHandler(async (req, res, next) => {
    try{
        await Job.updateOne(
            { _id: req.body.task_id },
            { $set: {deliveryDescription : req.body.description , deliveryTime : req.body.date, isDone: true} } // Updated fields
        );

        const task = await Job.findById(req.body.task_id);
        res.status(200).json({ data: task});
    }catch(e){ 
        console.log(e)
    }
})

exports.taskRating = asyncHandler(async (req, res, next) => {
    try{
        await Job.updateOne(
            { _id: req.body.task_id },
            { $set: {rating : req.body.rating} } // Updated fields
        );
        const task = await Job.findById(req.body.task_id);
        res.status(200).json({ data: task});
    }catch(e){ 
        console.log(e)
    }
})

exports.taskCard = asyncHandler(async (req, res, next) => {
    try{
        const task = await TaskCard.create({ 
            name : req.body.name
        });
        res.status(200).json({ data: task});
    }catch(e){ 
        console.log(e)
    }
})

exports.getTasksCards = asyncHandler(async (req, res, next) => {
    try{

        const tasks_cards = await TaskCard.find();
        let tasks_arr = [];
        let cards_arr = [];
        await Promise.all(tasks_cards.map(async (card) => {
            const tasks = await Job.find({taskCard: card._id});
            const newcard = Object.assign({}, {}, card);
            await Promise.all(tasks.map(async (task) => {
                tasks_arr.push(task);
            }));
            newcard._doc.tasks = tasks_arr;
            cards_arr.push(newcard._doc);
            tasks_arr = [];
        }));
        res.status(200).json({ data: cards_arr});
    }catch(e){ 
        console.log(e)
    }
})

exports.getTasksEmployee = asyncHandler(async (req, res, next) => {
    try{
        const user_id = req.params.id;
        const tasks_cards = await TaskCard.find({});
        let tasks_arr = [];
        let cards_arr = [];
        await Promise.all(tasks_cards.map(async (card) => {
            const tasks = await Job.find({taskCard: card._id , assignTo : user_id});
            const newcard = Object.assign({}, {}, card);
            await Promise.all(tasks.map(async (task) => {
                tasks_arr.push(task);
            }));
            newcard._doc.tasks = tasks_arr;
            if(tasks.length > 0) {
                cards_arr.push(newcard._doc);
            }
            tasks_arr = [];
        }));
        res.status(200).json({ data: cards_arr});
    }catch(e){ 
        console.log(e)
    }
})

exports.returnTasksToEmployee = asyncHandler(async (req, res, next) => {
    try{
        console.log(req.body)
        const task =  await Job.updateOne(
            { _id: req.body.id },
            { $set: {isDone : false , returnDescription : req.body.returnDescription , taskTime : req.body.taskTime} } // Updated fields
        );
        res.status(200).json({data : task});
    }catch(e){ 
        console.log(e)
    }
})

exports.deleteCard = asyncHandler(async (req, res, next) => {
    try{
        const card_id = req.params.id;
        await Job.deleteMany({card_id : card_id});
        await TaskCard.deleteOne({_id : card_id})
        res.status(200).json({data : 'done'});
    }catch(e){ 
        console.log(e)
    }
})

exports.updateCard = asyncHandler(async (req, res, next) => {
    try{
        await TaskCard.updateOne(
            { _id: req.params.id },
            { $set: {name : req.body.name} } // Updated fields
        );
        res.status(200).json({data : 'done'});
    }catch(e){ 
        console.log(e)
    }
})