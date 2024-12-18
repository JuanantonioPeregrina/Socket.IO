const express = require('express');
const router = express.Router();
const database = require('../database');

// Middleware para verificar si el usuario está logueado
function isAuthenticated(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login'); // Redirige si el usuario no está logueado
    }
    next();
}

// Ruta para obtener y mostrar los productos del carrito
router.get('/', (req, res) => {
    let cart;

    // Carrito en sesión para invitados
    if (!req.session.user) {
        cart = req.session.cart || [];
    } else {
        const userId = req.session.user.username;
        cart = database.cart.getCartItems(userId); // Carrito de usuarios autenticados
    }
    res.render('carrito', { cart });
});

// Ruta para añadir productos al carrito
router.post('/add', (req, res) => {
    const { productId } = req.body;

    // Validar que exista un producto
    if (!productId) {
        return res.status(400).send("Producto inválido.");
    }

    // Lógica para invitados: carrito en sesión
    if (!req.session.user) {
        if (!req.session.cart) {
            req.session.cart = [];
        }
        const existingItem = req.session.cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            req.session.cart.push({ productId, quantity: 1, name: `Producto ${productId}`, price: 10 });
        }
    } else {
        // Lógica para usuarios autenticados: carrito en base de datos
        const userId = req.session.user.username;
        database.cart.addToCart(userId, productId);
    }

    // Emitir evento de actualización a todos los clientes
    req.io.emit('cartUpdated', { productId });
    res.json({ success: true });
});

// Ruta para vaciar el carrito
router.post('/clear', (req, res) => {
    if (!req.session.user) {
        req.session.cart = []; // Limpia el carrito en sesión
    } else {
        const userId = req.session.user.username;
        database.cart.clearCart(userId); // Limpia el carrito en base de datos
    }
    res.redirect('/carrito');
});

// Ruta para eliminar un producto específico del carrito
router.post('/remove', (req, res) => {
    const { productId } = req.body;

    // Si el usuario no está autenticado, manipulamos el carrito en sesión
    if (!req.session.user) {
        req.session.cart = req.session.cart || [];
        req.session.cart = req.session.cart.filter(item => item.productId !== productId);
    } else {
        // Para usuarios autenticados, eliminar de la base de datos
        const userId = req.session.user.username;
        database.cart.removeFromCart(userId, productId);
    }

    req.io.emit('cartUpdated', { productId }); // Notificar la actualización
    res.json({ success: true });
});

// Nueva ruta para devolver el carrito en formato JSON
router.get('/json', (req, res) => {
    let cart;

    // Carrito en sesión para invitados
    if (!req.session.user) {
        cart = req.session.cart || [];
    } else {
        const userId = req.session.user.username;
        cart = database.cart.getCartItems(userId);
    }

    res.json(cart); // Devuelve el carrito en formato JSON
});


module.exports = router;
