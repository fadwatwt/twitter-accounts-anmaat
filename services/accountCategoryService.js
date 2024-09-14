const asyncHandler = require('express-async-handler');
const slugify = require('slugify');

const ApiError = require('../utils/apiError');
const Category = require('../model/accountCategoryModel');
const Account = require('../model/accountModel');
const InstaAccount = require("../model/instaModel")
const InstaCategory = require("../model/instaAccountCategory")

const factory = require('./handlersFactory');
const {
  buildAncestors,
  buildHierarchyAncestors,
} = require('../utils/treeHandler');
const { login } = require('./authService');

// @desc    Get list of AccountCategories
// @route   GET /api/v1/accountcategories
// @access  Private
exports.getAccountCategories = factory.getAll(Category, 'accountcategories', ['accountCount']);

exports.getInstaAccountCategories = factory.getAll(InstaCategory, 'accountcategories', ['accountCount']);
// @desc    Get specific AccountCategory by id
// @route   GET /api/v1/accountcategories/:id
// @access  Private
exports.getAccountCategory = factory.getOne(Category);

exports.getInstaAccountCategory = factory.getOne(InstaCategory);
exports.deleteCategoryAccountSet = factory.deleteMany(Category);
exports.deleteCategoryInstaAccountSet = factory.deleteMany(InstaCategory);

// @desc    Create accountcategory
// @route   POST  /api/v1/accountcategories
// @access  Private/Admin
exports.createAccountCategory = asyncHandler(async (req, res, next) => {
  const parent = req.body.parent ? req.body.parent : null;
  const category = new Category({ name: req.body.name, parent });
  const newCategory = await category.save();
  let document = await buildAncestors(Category, newCategory._id, parent);

  if (JSON.stringify(document) === '{}' || document === undefined) {
    document = await Category.findById(newCategory._id);
  }

  res.status(201).send({ data: document });
});

exports.createInstaAccountCategory = asyncHandler(async (req, res, next) => {
  const parent = req.body.parent ? req.body.parent : null;
  console.log("here?");
  const category = new InstaCategory({ name: req.body.name, parent });
  const newCategory = await category.save();
  let document = await buildAncestors(InstaCategory, newCategory._id, parent);

  if (JSON.stringify(document) === '{}' || document === undefined) {
    document = await InstaCategory.findById(newCategory._id);
  }

  res.status(201).send({ data: document });
});

// @desc    Move specific accountcategory to new parent category
// @route   POST /api/v1/accountcategories/move
// @access  Private/Admin
exports.moveCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(
    req.body.id,
    {
      $set: { parent: req.body.parent },
    },
    { new: true }
  );

  if (!category) {
    return next(new ApiError(`لايوجد تصنيف بهذا الرقم ${req.body.id}`, 404));
  }
  await buildHierarchyAncestors(Category, category._id, req.body.parent);
  //move accounts

  ////////////////////////////////
  const result = await Category.findById(req.body.id);
  res.status(200).json({ data: result });
});

exports.moveInstaCategory = asyncHandler(async (req, res, next) => {
  const category = await InstaCategory.findByIdAndUpdate(
    req.body.id,
    {
      $set: { parent: req.body.parent },
    },
    { new: true }
  );

  if (!category) {
    return next(new ApiError(`لايوجد تصنيف بهذا الرقم ${req.body.id}`, 404));
  }
  await buildHierarchyAncestors(InstaCategory, category._id, req.body.parent);
  //move accounts

  ////////////////////////////////
  const result = await InstaCategory.findById(req.body.id);
  res.status(200).json({ data: result });
});
// @desc    Update specific accountcategory name
// @route   PUT /api/v1/accountcategories/:id
// @access  Private/Admin
exports.updateAccountCategory = async (req, res) => {
  const { id } = req.params;
  const { name, parent, supervisor } = req.body;

  try {
    let category = await Category.findById(id).populate('parent');

    if (!category) {
      return res.status(404).json({ error: `لا يوجد تصنيف بالرقم ${id}` });
    }

    // تحديث البيانات المتاحة
    if (name) {
      category.name = name;
    }
    if (parent) {
      category.parent = parent;
    }
    if (supervisor) {
      category.supervisor = supervisor;
    }

    await category.save();

    // إعادة تحميل الفئة بعد التحديث للحصول على الأصل
    category = await Category.findById(id).populate('parent');

    res.status(200).json({ data: category });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ ما' });
  }
};


exports.updateInstaAccountCategory = asyncHandler(async (req, res, next) => {
  console.log("heree?");
  const document = await InstaCategory.findByIdAndUpdate(
    req.params.id,
    {
      $set: { name: req.body.name, slug: slugify(req.body.name) },
    },
    { new: true }
  );
  if (!document) {
    return next(new ApiError(`لايوجد تصنيف بهذا الرقم ${req.params.id}`, 404));
  }
  //update the category name and the slug in the ancestors array of all the descendants documents using the following query:

  await InstaCategory.updateMany(
    { 'ancestors._id': req.params.id },
    {
      $set: {
        'ancestors.$.name': req.body.name,
        'ancestors.$.slug': slugify(req.body.name),
      },
    }
  );
  res.status(200).json({ data: document });
});

// @desc    Delete specific accountcategory
// @route   DELETE /api/v1/accountcategories/:id
// @access  Private/Admin

exports.deleteAccountCategory = asyncHandler(async (req, res, next) => {
  const document = await Category.findByIdAndRemove(req.params.id);
  if (!document)
    return next(new ApiError(`لايوجد تصنيف بهذا الرقم ${req.params.id}`, 404));
  //get descendant of category
  const des = await Category.find({ 'ancestors._id': req.params.id }).distinct(
    '_id'
  );
  await Account.deleteMany({ Category: { $in: des } });

  //delete descendants of the category
  const result = await Category.deleteMany({ 'ancestors._id': req.params.id });
  ////delete account belong to this category
  const account = await Account.deleteMany({ Category: req.params.id });

  res.status(204).send();
});
// @desc    Get specific AccountCategory descendants
// @route   GET /api/v1/accountcategories/descendants
// @access  Private
exports.descendants = asyncHandler(async (req, res, next) => {
  const result = await Category.find({ 'ancestors._id': req.query.id })
    .select({ _id: false, name: true })
    .exec();

  res.status(200).json({ data: result });
});

exports.deleteInstaAccountCategory = asyncHandler(async (req, res, next) => {
  const document = await InstaCategory.findByIdAndRemove(req.params.id);
  if (!document)
    return next(new ApiError(`لايوجد تصنيف بهذا الرقم ${req.params.id}`, 404));
  //get descendant of category
  const des = await InstaCategory.find({ 'ancestors._id': req.params.id }).distinct(
    '_id'
  );
  await Account.deleteMany({ Category: { $in: des } });

  //delete descendants of the category
  const result = await InstaCategory.deleteMany({ 'ancestors._id': req.params.id });
  ////delete account belong to this category
  const account = await InstaAccount.deleteMany({ Category: req.params.id });

  res.status(204).send();
});
// @desc    Get specific AccountCategory descendants
// @route   GET /api/v1/accountcategories/descendants
// @access  Private
exports.instaDescendants = asyncHandler(async (req, res, next) => {
  const result = await InstaCategory.find({ 'ancestors._id': req.query.id })
    .select({ _id: false, name: true })
    .exec();

  res.status(200).json({ data: result });
});
