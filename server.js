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
function getUserSocket(user_id) {
  return socketUsers.find(user => user.user_id === user_id) || null;
}
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
    if (getSocketId && getSocketId.socket_id) {
      const socket_id = getSocketId.socket_id;
      console.log(socket_id);
      console.log(data);
      io.to(socket_id).emit('getNotification', { data });
    } else {
      console.error('User socket ID not found or user is not connected');
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


app.use(cors());
app.options('*', cors());
////parse form fields
app.use(bodyParser.urlencoded({ extended: true }));


/////enable cookies
app.use(cookieParser());
;
// Middlewares
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

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

module.exports = { getUserSocket, io, addUserSocket, deleteUserSocket };
