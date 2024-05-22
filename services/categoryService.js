const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactory');
const Category = require('../model/categoryModel');
const InstaCategory = require('../model/InstaCategoryModel');

// @desc    Get list of categories
// @route   GET /api/v1/categories
// @access  Private
exports.getCategories = factory.getAll(Category);
exports.getInstaCategories = factory.getAll(InstaCategory);

// @desc    Get specific category by id
// @route   GET /api/v1/categories/:id
// @access  Private
exports.getCategory = factory.getOne(Category);
exports.getInstaCategory = factory.getOne(InstaCategory);

// @desc    Create category
// @route   POST  /api/v1/categories
// @access  Private/Admin
exports.createCategory = factory.createOne(Category);
exports.createInstaCategory = factory.createOne(InstaCategory);

// @desc    Update specific category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
exports.updateCategory = factory.updateOne(Category);
exports.updateInstaCategory = factory.updateOne(InstaCategory);

// @desc    Delete specific category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
exports.deleteCategory = factory.deleteOne(Category);
exports.deleteInstaCategory = factory.deleteOne(InstaCategory);
/////delete set of category
// @route   POST /api/v1/categories/delete
// @access  Private
exports.deleteCategorySet = factory.deleteMany(Category);
exports.deleteInstaCategorySet = factory.deleteMany(InstaCategory);
