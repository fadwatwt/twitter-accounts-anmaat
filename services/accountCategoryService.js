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

// Scopes every category query to the caller's subscriber so categories created
// by other subscribers are never visible.
exports.scopeCategoriesToSubscriber = asyncHandler(async (req, res, next) => {
  if (!req.subscriberId) {
    return next(new ApiError('Subscriber context is required', 401));
  }
  req.filterObj = {
    ...(req.filterObj || {}),
    subscriber_id: req.subscriberId,
  };
  next();
});

// @desc    Get list of AccountCategories (scoped to subscriber)
// @route   GET /api/v1/accountcategories
// @access  Private
exports.getAccountCategories = factory.getAll(Category, 'accountcategories', ['accountCount']);

exports.getInstaAccountCategories = factory.getAll(InstaCategory, 'accountcategories', ['accountCount']);

// @desc    Get specific AccountCategory by id (scoped to subscriber)
// @route   GET /api/v1/accountcategories/:id
// @access  Private
exports.getAccountCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({
    _id: req.params.id,
    subscriber_id: req.subscriberId,
  });
  if (!category) {
    return next(new ApiError(`No category found for id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: category });
});

exports.getInstaAccountCategory = factory.getOne(InstaCategory);
exports.deleteCategoryAccountSet = factory.deleteMany(Category);
exports.deleteCategoryInstaAccountSet = factory.deleteMany(InstaCategory);

// @desc    Create accountcategory (subscriber-scoped)
// @route   POST  /api/v1/accountcategories
// @access  Private
exports.createAccountCategory = asyncHandler(async (req, res, next) => {
  if (!req.subscriberId) {
    return next(new ApiError('Subscriber context is required', 401));
  }

  const parent = req.body.parent ? req.body.parent : null;

  if (parent) {
    const parentCategory = await Category.findOne({
      _id: parent,
      subscriber_id: req.subscriberId,
    });
    if (!parentCategory) {
      return next(new ApiError('الفئة الأب غير موجودة', 404));
    }
  }

  const existing = await Category.findOne({
    subscriber_id: req.subscriberId,
    name: req.body.name,
  });
  if (existing) {
    return next(new ApiError('اسم التصنيف موجود من قبل', 409));
  }

  const category = new Category({
    name: req.body.name,
    parent,
    subscriber_id: req.subscriberId,
    created_by: req.userId,
  });
  const newCategory = await category.save();
  let document = await buildAncestors(Category, newCategory._id, parent);

  if (JSON.stringify(document) === '{}' || document === undefined) {
    document = await Category.findById(newCategory._id);
  }

  res.status(201).send({ data: document });
});

exports.createInstaAccountCategory = asyncHandler(async (req, res, next) => {
  const parent = req.body.parent ? req.body.parent : null;
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
// @access  Private
exports.moveCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({
    _id: req.body.id,
    subscriber_id: req.subscriberId,
  });
  if (!category) {
    return next(new ApiError(`لا يوجد تصنيف بهذا الرقم ${req.body.id}`, 404));
  }

  if (req.body.parent) {
    const parentCategory = await Category.findOne({
      _id: req.body.parent,
      subscriber_id: req.subscriberId,
    });
    if (!parentCategory) {
      return next(new ApiError('الفئة الأب غير موجودة', 404));
    }
  }

  category.parent = req.body.parent || null;
  await category.save();
  await buildHierarchyAncestors(Category, category._id, req.body.parent);

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

  const result = await InstaCategory.findById(req.body.id);
  res.status(200).json({ data: result });
});

// @desc    Update specific accountcategory (subscriber-scoped)
// @route   PUT /api/v1/accountcategories/:id
// @access  Private
exports.updateAccountCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, parent } = req.body;

  const category = await Category.findOne({
    _id: id,
    subscriber_id: req.subscriberId,
  });
  if (!category) {
    return next(new ApiError(`لا يوجد تصنيف بالرقم ${id}`, 404));
  }

  if (name && name !== category.name) {
    const dup = await Category.findOne({
      subscriber_id: req.subscriberId,
      name,
      _id: { $ne: id },
    });
    if (dup) {
      return next(new ApiError('اسم التصنيف موجود بالفعل', 409));
    }
    category.name = name;
  }

  if (parent !== undefined) {
    if (parent) {
      if (String(parent) === String(id)) {
        return next(new ApiError('لا يمكن جعل التصنيف أصلاً لنفسه', 400));
      }
      const parentCategory = await Category.findOne({
        _id: parent,
        subscriber_id: req.subscriberId,
      });
      if (!parentCategory) {
        return next(new ApiError('الفئة الأب غير موجودة', 404));
      }
    }
    category.parent = parent || null;
  }

  await category.save();

  if (parent !== undefined) {
    await buildHierarchyAncestors(Category, category._id, parent || null);
  }

  const result = await Category.findById(id).populate('parent');
  res.status(200).json({ data: result });
});


exports.updateInstaAccountCategory = asyncHandler(async (req, res, next) => {
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

// @desc    Delete specific accountcategory (subscriber-scoped, cascades safely)
// @route   DELETE /api/v1/accountcategories/:id
// @access  Private
exports.deleteAccountCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({
    _id: req.params.id,
    subscriber_id: req.subscriberId,
  });
  if (!category) {
    return next(new ApiError(`لايوجد تصنيف بهذا الرقم ${req.params.id}`, 404));
  }

  // descendants owned by *this* subscriber only — never touch other tenants
  const descendantIds = await Category.find({
    'ancestors._id': req.params.id,
    subscriber_id: req.subscriberId,
  }).distinct('_id');

  const allIds = [req.params.id, ...descendantIds];

  await Account.deleteMany({
    Category: { $in: allIds },
    subscriber_id: req.subscriberId,
  });

  await Category.deleteMany({
    _id: { $in: allIds },
    subscriber_id: req.subscriberId,
  });

  res.status(204).send();
});

// @desc    Get specific AccountCategory descendants (subscriber-scoped)
// @route   GET /api/v1/accountcategories/descendants
// @access  Private
exports.descendants = asyncHandler(async (req, res, next) => {
  const result = await Category.find({
    'ancestors._id': req.query.id,
    subscriber_id: req.subscriberId,
  })
    .select({ _id: false, name: true })
    .exec();

  res.status(200).json({ data: result });
});

exports.deleteInstaAccountCategory = asyncHandler(async (req, res, next) => {
  const document = await InstaCategory.findByIdAndRemove(req.params.id);
  if (!document)
    return next(new ApiError(`لايوجد تصنيف بهذا الرقم ${req.params.id}`, 404));
  const des = await InstaCategory.find({ 'ancestors._id': req.params.id }).distinct(
    '_id'
  );
  await Account.deleteMany({ Category: { $in: des } });

  const result = await InstaCategory.deleteMany({ 'ancestors._id': req.params.id });
  const account = await InstaAccount.deleteMany({ Category: req.params.id });

  res.status(204).send();
});

exports.instaDescendants = asyncHandler(async (req, res, next) => {
  const result = await InstaCategory.find({ 'ancestors._id': req.query.id })
    .select({ _id: false, name: true })
    .exec();

  res.status(200).json({ data: result });
});
