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
let guestCounter = 0; // Contador global para numerar a los invitados
const activeGuests = {}; // Objeto para almacenar invitados activos

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    let username = null; // Nombre asignado al usuario
    let userRoom = null; // Sala específica del usuario

    // Chat de soporte: Unirse a la sala
    socket.on('joinSupport', (role) => {
        if (role === 'admin') {
            username = 'Admin';
            userRoom = 'admins';
            socket.join(userRoom);
            console.log(`${username} se unió a la sala ${userRoom}`);

            // Enviar la lista de invitados activos
            socket.emit('activeGuests', activeGuests);
        } else {
            guestCounter++;
            username = `guest-${guestCounter}`;
            userRoom = `guest-${socket.id}`;
            socket.join(userRoom);

            // Guardar invitado activo
            activeGuests[socket.id] = username;

            console.log(`Usuario ${username} se unió a la sala ${userRoom}`);

            // Notificar a los administradores
            io.to('admins').emit('receiveMessage', {
                message: `${username} se ha conectado`,
                sender: 'Sistema'
            });

            io.to('admins').emit('activeGuests', activeGuests);
        }
    });

    // Chat de soporte: Manejar mensajes
    socket.on('sendMessage', ({ role, message, targetRoom }) => {
        if (role === 'admin') {
            if (targetRoom && activeGuests[targetRoom]) {
                io.to(`guest-${targetRoom}`).emit('receiveMessage', { message, sender: 'Admin' });
            }
        } else {
            io.to('admins').emit('receiveMessage', { message, sender: username });
        }
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
        if (username && userRoom) {
            delete activeGuests[socket.id]; // Eliminar invitado de la lista
            io.to('admins').emit('activeGuests', activeGuests);
            io.to('admins').emit('receiveMessage', {
                message: `${username} se ha desconectado`,
                sender: 'Sistema'
            });
        }
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
