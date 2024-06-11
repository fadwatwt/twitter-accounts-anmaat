const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const flash = require('connect-flash');
var timeout = require('connect-timeout');
const http = require('http');
dotenv.config({ path: 'config.env' });
const authService = require('./services/authService');

const ApiError = require('./utils/apiError');
const globalError = require('./middleware/errorMiddleware');
const dbConnection = require('./config/database');

// Routes
const mountRoutes = require('./routes');
//const mountWebRoutes = require("./webRoute");
///store sessions
// const store = new MongoDBStore({
//   uri: process.env.DB_URI,
//   collection: "sessions",
// });
//const { webhookCheckout } = require('./services/orderService');

// Connect with db
dbConnection();

// express app
// express app
const app = express();
const server = http.createServer(app);
let socketUsers = [];

const addUserSocket = (user_id, socket_id) => {
  const new_Arr = [];
  socketUsers.forEach((user) => {
    if (user.user_id !== user_id) {
      new_Arr.push(user);
    }
  });
  socketUsers = new_Arr;
  !socketUsers.some((user) => user.user_id === user_id) &&
    socketUsers.push({ user_id, socket_id });
};
const getUserSocket = (user_id) => {
  const user = socketUsers.find((user) => user.user_id === user_id);
  if (user) {
    return user;
  } else {
    return '';
  }
};

const deleteUserSocket = (socket_id) => {
  socketUsers = socketUsers.filter((user) => user.socket_id !== socket_id);
};

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const { getConversationUsers } = require('./services/conversationService');

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', (socket) => {
    deleteUserSocket(socket.id);
    console.log('deleteUser');
    console.log(socketUsers);
  });

  socket.on('auth', (data) => {
    addUserSocket(data.user_id, socket.id);
    console.log(socketUsers);
    io.emit('getUsers', socketUsers);
  });

  socket.on('sendNotification', (data) => {
    const getSocketId = getUserSocket(data.user_id);
    const socket_id = getSocketId.socket_id;
    console.log(socket_id);
    console.log(data);
    if (socket_id) {
      io.to(socket_id).emit('getNotification', { data });
    }
  });

  socket.on('newMessage', async (data) => {
    const getUsersId = await getConversationUsers(data.chat_id);
    Array.prototype.forEach.call(getUsersId, (child) => {
      if (child !== data.sender_id) {
        const getSocketId = getUserSocket(child);
        const socket_id = getSocketId.socket_id;
        console.log(data);
        console.log(getSocketId.socket_id);
        if (socket_id) {
          io.to(socket_id).emit('getMessages', { data });
        }
      }
    });
  });
});

// Enable other domains to access your application
app.use(cors());
app.options('*', cors());
////parse form fields
app.use(bodyParser.urlencoded({ extended: true }));

// compress all responses
// app.use(compression());

/////enable cookies
app.use(cookieParser());
////session
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     store: store,
//   })
// );
/////flash messages
//app.use(flash());
// Middlewares
app.use(express.json());
// app.use(express.static(path.join(__dirname, 'build')));

///ejs engine configuration
//app.set("view engine", "ejs");
//app.set("views", "views");

//app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

// Limit each IP to 100 requests per `window` (here, per 15 minutes)
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   message:
//     "Too many requests created from this IP, please try again after an hour",
// });

// app.use((req, res, next) => {
//   if (req.session.isLoggedIn && req.session.user) {
//     res.locals.isAuthenticated = req.session.isLoggedIn;
//     res.locals.user = req.session.user;
//   }
//   next();
// });
// Apply the rate limiting middleware to all requests
// app.use("/api", limiter);

// Middleware to protect against HTTP Parameter Pollution attacks
// app.use(
//   hpp({
//     whitelist: [
//       "price",
//       "sold",
//       "quantity",
//       "ratingsAverage",
//       "ratingsQuantity",
//     ],
//   })
// );

// Mount Routes
mountRoutes(app);
//mountWebRoutes(app);
app.use(
  '/files',
  authService.protect,
  express.static(path.join(__dirname, 'uploads'))
);

app.use(
  '/uploads/conversations',
  express.static(path.join(__dirname, 'uploads/conversations'))
);

app.use('/', (req, res) => {
  res.send('Server is running...');
});

app.get('/api', (req, res) => {
  res.send('Hello from server, kiro here');
});

// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handling middleware for express
app.use(globalError);
//app.use(timeout("300s")); //set 5m timeout for all requests

const PORT = process.env.PORT || 8000;
const server_ = server.listen(PORT, () => {
  console.log(`App running running on port ${PORT}`);
});
// Handle rejection outside express
process.on('unhandledRejection', (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  server_.close(() => {
    console.error(`Shutting down....`);
    process.exit(1);
  });
});

module.exports = { io, getUserSocket, addUserSocket, deleteUserSocket };
