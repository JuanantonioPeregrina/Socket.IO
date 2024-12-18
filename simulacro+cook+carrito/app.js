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
const carritoRouter = require('./routes/carrito');

const app = express();
const http = require('http'); // Importar http para el servidor
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  // Escuchar el evento de comentarios
  socket.on('sendComment', (data) => {
      const { productId, comment } = data;
      console.log(`Comentario recibido en producto ${productId}: ${comment}`);
      
      // Reenviar el comentario a todos los clientes
      io.emit('receiveComment', { productId, comment }); 
  });

  socket.on('disconnect', () => {
      console.log('Cliente desconectado');
  });
});


app.use((req, res, next) => {
    req.io = io;
    next();
});

// Ajustar el arranque del servidor para usar http
server.listen(4000, () => {
    console.log(`Servidor corriendo en http://localhost:4000`);
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/cookies', cookiesRouter);


app.use(session({
  secret: "Una frase muy secreta",
  resave: false,
  saveUninitialized: true
}));

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
  res.locals.user = req.session.user || null; // Asegura que 'user' esté disponible en las vistas
  console.log("Middleware ejecutado - user:", res.locals.user); // Mensaje de depuración
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
app.use('/carrito', carritoRouter); // Define la ruta base /carrito
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
