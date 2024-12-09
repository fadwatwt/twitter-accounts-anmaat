const authRoute = require('./authRoute');
const userRoute = require('./userRoute');
const clientRoute = require('./clientRoute');
const contentRoute = require('./contentRoute');
const categoryRoute = require('./categoryRoute');
const fileRoute = require('./fileRoute');
const attandanceRoute = require('./attandanceRoute');
const departmentsRoute = require('./departmentRoute');
const accountCategoryRoute = require('./accountCategoryRoute');
const accountRoute = require('./accountRoute');
const methodRoute = require('./methodRoute');
const captchaRoute = require('./captchaRoute');
const instaRoute = require('./instegramRoute');
const conversationRoute = require('./conversationRoute');
const notificationRoute = require('./notificationRoute');
// const chartsRoute = require('./chartsRoute');
const userCvRoute = require('./userCvRoute');


const mountRoutes = (app) => {
  app.use('/api/v1/users', userRoute);
  app.use('/api/v1/auth', authRoute);
  app.use('/api/v1/clients', clientRoute);
  app.use('/api/v1/contents', contentRoute);
  app.use('/api/v1/categories', categoryRoute);
  app.use('/api/v1/files', fileRoute);
  app.use('/api/v1/attandances', attandanceRoute);
  app.use('/api/v1/departments', departmentsRoute);
  app.use('/api/v1/accountcategories', accountCategoryRoute);
  app.use('/api/v1/accounts', accountRoute);
  app.use('/api/v1/methods', methodRoute);
  app.use('/api/v1/captchas', captchaRoute);
  app.use('/api/v1/insta', instaRoute);
  app.use('/api/v1/conversations', conversationRoute);
  app.use('/api/v1/notifications', notificationRoute);
  // app.use('/api/v1/charts', chartsRoute);
  app.use('/api/v1/usercv', userCvRoute);
};

module.exports = mountRoutes;
