const express = require('express');
const router = express.Router();
const database = require('../database');

// Ruta para aceptar cookies
router.post('/accept', (req, res) => {
    if (req.session.user && req.session.user.username) {
        try {
            database.user.acceptCookies(req.session.user.username);
            res.status(200).json({ message: 'Cookies aceptadas' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'No se pudieron aceptar las cookies' });
        }
    } else {
        res.status(401).json({ error: 'Usuario no autenticado' });
    }
});

module.exports = router;

