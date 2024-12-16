const express = require('express');
const router = express.Router();
const database = require('../database');

router.get('/', function(req, res, next) {
  res.render('login', {user: req.session.user, title: res.locals.title});
});

router.post('/', async (req, res) => {
  const user = req.body.user;
  if (await database.user.isLoginRight(user, req.body.pass)) {
    req.session.user = { username: user }; // Guarda el usuario en la sesión
    req.session.message = "¡Login correcto!";
    console.log("Usuario autenticado:", req.session.user); // Depuración
    res.redirect("/tienda");
  } else {
    req.session.error = "Incorrect username or password.";
    res.redirect("/login");
  }
});


module.exports = router;
