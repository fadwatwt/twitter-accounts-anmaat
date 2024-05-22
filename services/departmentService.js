const factory = require('./handlersFactory');
const Department = require('../model/departmentModel');

// @desc    Get list of Departments
// @route   GET /api/v1/departments
// @access  Private
exports.getDepartments = factory.getAll(Department, 'Departments');

// @desc    Get specific Department by id
// @route   GET /api/v1/departments/:id
// @access  Private
exports.getDepartment = factory.getOne(Department);

// @desc    Create Department
// @route   POST  /api/v1/departments
// @access  Private/Admin
exports.createDepartment = factory.createOne(Department);

// @desc    Update specific Department
// @route   PUT /api/v1/departments/:id
// @access  Private/Admin
exports.updateDepartment = factory.updateOne(Department);

// @desc    Delete specific Department
// @route   DELETE /api/v1/departments/:id
// @access  Private/Admin
exports.deleteDepartment = factory.deleteOne(Department);
/////delete set of department
// @route   POST /api/v1/departments/delete
// @access  Private
exports.deleteManyDepartment = factory.deleteMany(Department);
