const factory = require('./handlersFactory');
const TaskInfo = require('../model/taskInfoModel');

// @desc    Get list of categories
// @route   GET /api/v1/categories
// @access  Private
exports.getTaskInfos = factory.getAll(TaskInfo);

// @desc    Get specific category by id
// @route   GET /api/v1/categories/:id
// @access  Private
exports.getTaskInfo = factory.getOne(TaskInfo);

// @desc    Create category
// @route   POST  /api/v1/categories
// @access  Private/Admin
exports.createTaskInfo = factory.createOne(TaskInfo);

// @desc    Update specific category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
exports.updateTaskInfo = factory.updateOne(TaskInfo);

// @desc    Delete specific category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
exports.deleteTaskInfo = factory.deleteOne(TaskInfo);
