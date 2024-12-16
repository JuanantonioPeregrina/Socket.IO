const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const config = require('./config');

const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');
const tiendaRouter = require('./routes/tienda');
const restrictedRouter = require('./routes/restricted');
const cookiesRouter = require('./routes/cookies');
const database = require('./database/index'); // Ajusta la ruta según la estructura de tu proyecto

const soporteRouter = require('./routes/soporte');
const chatModel = require('./database/models/chat.model');



const app = express();
const http = require('http'); // Importar http para el servidor
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Integración básica de Sockets.io
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

  // Escuchar el evento de comentarios
  socket.on('sendComment', (comment) => {
      console.log(`Comentario recibido: ${comment}`);
      io.emit('receiveComment', comment); // Enviar a todos los clientes conectados
  });

  // Chat de soporte: Unirse a la sala
  socket.on('joinSupport', (role) => {
      const room = role === 'admin' ? 'admins' : 'guests';
      socket.join(room);
      console.log(`Usuario ${socket.id} se unió a la sala ${room}`);

      // Enviar mensajes pendientes al usuario que acaba de unirse
      const pendingMessages = chatModel.getPendingMessages(room);
      pendingMessages.forEach((msg) => {
          socket.emit('receiveMessage', msg);
      });
  });

  // Chat de soporte: Manejar mensajes
  socket.on('sendMessage', ({ role, message }) => {
      const targetRoom = role === 'admin' ? 'guests' : 'admins';
      const msg = { message, sender: role, timestamp: new Date() };

      // Si la sala tiene usuarios activos, enviar el mensaje
      if (io.sockets.adapter.rooms.get(targetRoom)) {
          io.to(targetRoom).emit('receiveMessage', msg);
      } else {
          // Almacenar mensaje como pendiente
          chatModel.addPendingMessage(targetRoom, message, role);
          console.log(`Mensaje pendiente guardado para la sala ${targetRoom}`);
      }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
  });
});


// Ajustar el arranque del servidor para usar http
server.listen(4000, () => {
    console.log(`Servidor corriendo en http://localhost:4000`);
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuración de express-session (antes de las rutas)
app.use(session({
  secret: "Una frase muy secreta",
  resave: false,
  saveUninitialized: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/cookies', cookiesRouter);
app.use('/soporte', soporteRouter);

app.use((req,res,next) => {
  const message = req.session.message;
  const error = req.session.error;
  delete req.session.message;
  delete req.session.error;
  res.locals.message = "";
  res.locals.error = "";
  if(message) res.locals.message = `<p>${message}</p>`;
  if(error) res.locals.error = `<p>${error}</p>`;
  next();
});

app.use((req, res, next) => {
  res.locals.title = config.shopName;
  next();
});

app.use((req, res, next) => {
  res.locals.cookiesAccepted = req.session.user
    ? database.user.hasAcceptedCookies(req.session.user.username)
    : false;
  next();
});





app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/tienda', tiendaRouter);
app.use('/restricted', restricted, restrictedRouter);
app.use('/logout', (req,res) =>{
  req.session.destroy();
  res.redirect("/");
});



function restricted(req, res, next){
  if(req.session.user){
    next();
  } else {
    res.redirect("login");
  }
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
