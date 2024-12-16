const cart = {};

cart.data = {}; // Almacén en memoria para los carritos

// Obtener los productos del carrito
cart.getCartItems = function (userId) {
    return cart.data[userId] || []; // Devuelve el carrito del usuario o un array vacío
};

// Añadir un producto al carrito
cart.addToCart = function (userId, productId) {
    if (!cart.data[userId]) {
        cart.data[userId] = [];
    }

    const existingItem = cart.data[userId].find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity += 1; // Incrementa la cantidad si ya existe
    } else {
        cart.data[userId].push({ productId, quantity: 1 }); // Añade el producto al carrito
    }
};

// Vaciar el carrito
cart.clearCart = function (userId) {
    cart.data[userId] = []; // Vacía el carrito del usuario
};

module.exports = cart;
