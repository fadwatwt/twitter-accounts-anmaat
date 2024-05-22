const licenseKey = require('license-key-gen');

const createSerial = (client) => {
  const licenseData = {
    info: client,
    prodCode: 'ProTweet123',
    osType: 'WIN10',
  };

  return licenseKey.createLicense(licenseData);
};

module.exports = createSerial;
