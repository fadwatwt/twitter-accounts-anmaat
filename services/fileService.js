const asyncHandler = require('express-async-handler');
const fs = require('fs');
const ApiError = require('../utils/apiError');
const handlers = require('../utils/FileHandlers');

exports.readFile = asyncHandler(async (req, res, next) => {
  const subDirectories = handlers.extractYearMonthFromFile(req.body.fileName);
  const FileUrl = `${process.env.BASE_URL}/${subDirectories}/${req.body.fileName}`;
  console.log(FileUrl);
  fs.readFile(FileUrl, 'utf-8', (e, text) => {
    if (e)
      return next(new ApiError(`لا يوجد ملف لهذا الاسم ${req.params.id}`, 404));

    res.status(203).json({ data: text });
  });
});

exports.WriteFile = asyncHandler(async (req, res, next) => {
  const subDirectories = handlers.extractYearMonthFromFile(req.body.fileName);
  const FileUrl = `${process.env.BASE_URL}/${subDirectories}/${req.body.fileName}`;

  fs.writeFile(FileUrl, req.body.text, (e) => {
    if (e)
      return next(new ApiError(`لا يوجد ملف لهذا الاسم ${req.params.id}`, 404));

    res.status(203).json({ data: 'تم تحديث الملف بنجاح' });
  });
});
