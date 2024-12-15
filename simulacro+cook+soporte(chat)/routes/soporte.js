const express = require('express');
const router = express.Router();

// Ruta para renderizar la vista del soporte
router.get('/', (req, res) => {
    const user = req.session.user || null;
    res.render('soporte', { user, title: 'Soporte' });
});

module.exports = router;
