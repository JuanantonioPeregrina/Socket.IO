
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const user = req.session.user || null; // Asegurarse de manejar sesiones no inicializadas
    res.render('soporte', { title: 'Soporte', user });
});

module.exports = router;
