const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactory');
const Category = require('../model/categoryModel');
const InstaCategory = require('../model/InstaCategoryModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/text/categories');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
exports.uploadFiles = upload.array('textFiles', 10);

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
// exports.createCategory = factory.createOne(Category);

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, supervisor } = req.body;

  console.log(name,supervisor);

  const filePaths = req.files.map((file) => file.path.replace(/^uploads[\/\\]*/, ''));

  const category = await Category.create({
    name,
    slug: name.toLowerCase().replace(/ /g, '-'),
    supervisor,
    files: filePaths,
  });

  res.status(201).json({
    status: 'success',
    data: category,
  });
});

exports.createInstaCategory = factory.createOne(InstaCategory);

// @desc    Update specific category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const { name, supervisor } = req.body;

  console.log(name, supervisor);

  // مسار الملفات الجديدة
  let newFilePaths = [];
  if (req.files && req.files.length > 0) {
    newFilePaths = req.files.map((file) => file.path.replace(/^uploads[\/\\]*/, ''));
  }

  // العثور على التصنيف المطلوب تحديثه
  let category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      status: 'fail',
      message: 'Category not found',
    });
  }

  category.name = name || category.name;
  category.slug = name ? name.toLowerCase().replace(/ /g, '-') : category.slug;
  category.supervisor = supervisor || category.supervisor;

  if (newFilePaths.length > 0) {
    category.files = [...category.files, ...newFilePaths];
  }

  await category.save();

  res.status(200).json({
    status: 'success',
    data: category,
  });
});
exports.updateInstaCategory = factory.updateOne(InstaCategory);

// @desc    Delete specific category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin

exports.deleteCategory = asyncHandler(async (req,res) => {
  const categoryId = req.params.id;
  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).send('Category not found');
    }

    const filesToDelete = category.files.map(file => path.join(__dirname,'..', 'uploads', file));

    await Category.findByIdAndDelete(categoryId);
    console.log(filesToDelete);
    filesToDelete.forEach(file => {
      fs.unlink(file, (err) => {
        if (err) {
          console.error(`Error deleting file: ${file}`, err);
        } else {
          console.log(`Deleted file: ${file}`);
        }
      });
    });
    res.status(200).send('Category and its files deleted successfully');
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).send('Server error');
  }
})
exports.deleteInstaCategory = factory.deleteOne(InstaCategory);
/////delete set of category
// @route   POST /api/v1/categories/delete
// @access  Private
exports.deleteFileCategory = asyncHandler(async (req, res, next) => {
  const { categoryId, file } = req.body;

  const filePath = path.join(__dirname, '..', 'uploads', file);

  try {
    await fs.promises.access(filePath);
    await fs.promises.unlink(filePath);
    console.log(`Successfully deleted file: ${filePath}`);
  } catch (err) {
    console.error(`Error deleting file: ${filePath}`, err);
    return res.status(500).json({ message: "Error deleting file" });
  }

  try {
    await Category.findByIdAndUpdate(
      categoryId,
      { $pull: { files: file } },
      { new: true }
    );
    console.log(`Successfully removed file reference from category: ${categoryId}`);
  } catch (err) {
    console.error(`Error updating category: ${categoryId}`, err);
    return res.status(500).json({ message: "Error updating category" });
  }

  // 3. إرسال استجابة ناجحة
  res.status(204).send();
});

exports.deleteCategorySet = asyncHandler(async (req, res, next) => {
  const sets = req.body.ids;

  // جلب الفئات التي سيتم حذفها
  const categories = await Category.find({ _id: { $in: sets } });

  // تحقق من وجود الفئات
  if (!categories || categories.length === 0) {
    return res.status(404).json({ message: "No categories found." });
  }

  // حذف الملفات المرتبطة بالفئات
  for (const category of categories) {
    for (const file of category.files) {
      // بناء المسار الصحيح للملف
      const filePath = path.join(__dirname, '..', 'uploads', file); // استخدام المسار الصحيح حسب هيكل مشروعك

      try {
        // تحقق من وجود الملف قبل حذفه
        await fs.promises.access(filePath);
        await fs.promises.unlink(filePath);
        console.log(`Successfully deleted file: ${filePath}`);
      } catch (err) {
        console.error(`Error deleting file: ${filePath}`, err);
        // يمكنك اختيار إما الاستمرار أو الخروج
      }
    }
  }

  // حذف الفئات من قاعدة البيانات
  await Category.deleteMany({ _id: { $in: sets } });
  res.status(204).send();
});
exports.deleteInstaCategorySet = factory.deleteMany(InstaCategory);
