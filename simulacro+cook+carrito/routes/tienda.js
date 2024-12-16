const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    // Definición estática de productos
    const productos = [
        { id: 1, nombre: 'Cecina', descripcion: 'La mejor cecina.', imagen: '/images/cecina.jpg' },
        { id: 2, nombre: 'Chorizo', descripcion: 'El mejor chorizo', imagen: '/images/chorizo.jpg' },
        { id: 3, nombre: 'Lomo', descripcion: 'Qué bueno está este lomo.', imagen: '/images/lomo.jpg' },
        { id: 4, nombre: 'Pimientos', descripcion: 'No podrían faltar.', imagen: '/images/pimientos.jpg' }
    ];

    res.render('tienda', { productos }); // Pasamos 'productos' a la vista
});

module.exports = router;
