const express = require('express');
const router = express.Router();
const database = require('../database'); // Importa la lógica del carrito y usuarios

// Middleware para verificar si el usuario está logueado
function isAuthenticated(req, res, next) {
    if (!req.session || !req.session.user) {
        req.session.error = "Debes iniciar sesión para acceder al carrito.";
        return res.redirect('/login'); // Redirige a login si no hay sesión
    }
    next();
}


// Ruta para obtener y mostrar los productos del carrito
router.get('/', isAuthenticated, (req, res) => {
    const userId = req.session.user.username; // Recupera el nombre de usuario de la sesión
    const cart = database.cart.getCartItems(userId); // Obtiene los productos del carrito
    res.render('carrito', { cart }); // Renderiza la vista carrito.ejs
});

// Ruta para añadir productos al carrito
router.post('/add', isAuthenticated, (req, res) => {
    const userId = req.session.user.username;
    const { productId } = req.body;

    if (!productId) {
        req.session.error = "Producto inválido.";
        return res.redirect('/tienda'); // Redirige a la tienda si falta el producto
    }

    try {
        database.cart.addToCart(userId, productId); // Añade el producto al carrito
        req.session.message = "Producto añadido al carrito correctamente.";
        res.redirect('/carrito'); // Redirige al carrito
    } catch (error) {
        console.error("Error al añadir producto al carrito:", error);
        res.status(500).send("Error interno al procesar el carrito.");
    }
});

// Ruta para vaciar el carrito
router.post('/clear', isAuthenticated, (req, res) => {
    const userId = req.session.user.username;

    try {
        database.cart.clearCart(userId); // Elimina todos los productos del carrito
        req.session.message = "Carrito vaciado correctamente.";
        res.redirect('/carrito'); // Redirige al carrito
    } catch (error) {
        console.error("Error al vaciar el carrito:", error);
        res.status(500).send("Error interno al vaciar el carrito.");
    }
});

module.exports = router;
