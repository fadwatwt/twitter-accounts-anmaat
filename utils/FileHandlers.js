const fs = require('fs');
const handlers = require('./FileHandlers');

exports.getCurrentDateNames = () => {
  // spin up the new Date object
  const date = new Date();

  // create the names with numeric prefixes
  // so they appear in the filesystem in chronological order
  const monthNames = [
    '01-Jan',
    '02-Feb',
    '03-Mar',
    '04-Apr',
    '05-May',
    '06-Jun',
    '07-Jul',
    '08-Aug',
    '09-Sep',
    '10-Oct',
    '11-Nov',
    '12-Dec',
  ];

  // date.getMonth() returns a number, so let's lookup our Array to
  // get the correct month we're in as actual text
  // date.getMonth() for January would return 0 so we can use it to lookup the correct value
  const month = monthNames[date.getMonth()];

  // return year as a String as Apps Script "createFolder" function
  // won't accept a number for the folder name
  // P.S. date.getFullYear().toString() also works, I think this is nicer to interpolate
  const year = `${date.getFullYear()}`;

  return { month, year };
};
exports.getSpecificFolder = () => {
  const { month, year } = handlers.getCurrentDateNames();

  const rootFolder = `./uploads/${year}/${month}`;

  if (!fs.existsSync(rootFolder)) {
    fs.mkdirSync(rootFolder, { recursive: true });
  }
  return rootFolder;
};
exports.extractYearMonthFromFile = (FileName) => {
  const filewithoutExtention = FileName.split('.');
  const arr = filewithoutExtention[0].split('_');

  return `${arr[2]}/${arr[1]}`;
};
exports.getFileFullPath = (FileName) => {
  const subDirectories = handlers.extractYearMonthFromFile(FileName);

  const filePath = `${process.env.BASE_URL}/${subDirectories}/${FileName}`;
  return filePath;
};
