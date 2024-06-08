const express = require('express');

const {
  getDepartmentValidator,
  createDepartmentValidator,
  updateDepartmentValidator,
  deleteDepartmentValidator,
  GroupDeleteValidator,
} = require('../utils/validators/departmentValidator');

const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  deleteManyDepartment,
} = require('../services/departmentService');

const authService = require('../services/authService');
const { roles } = require('../model/roleModel');

const router = express.Router();

router
  .route('/')
  .get(authService.protect, getDepartments)
  .post(
    authService.protect,
    authService.allowedTo(roles.admin,roles.manager),
    createDepartmentValidator,
    createDepartment
  );
router
  .route('/:id')
  .get(authService.protect, getDepartmentValidator, getDepartment)
  .put(
    authService.protect,
    authService.allowedTo(roles.admin),
    updateDepartmentValidator,
    updateDepartment
  )
  .delete(
    authService.protect,
    authService.allowedTo(roles.admin),
    deleteDepartmentValidator,
    deleteDepartment
  );
router
  .route('/delete')
  .post(
    authService.protect,
    authService.allowedTo(roles.admin),
    GroupDeleteValidator,
    deleteManyDepartment
  );
module.exports = router;
