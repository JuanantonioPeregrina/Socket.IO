const chat = {};

chat.pendingMessages = {}; // Objeto para almacenar mensajes pendientes por sala

// Método para agregar un mensaje pendiente
chat.addPendingMessage = function (room, message, sender) {
    if (!chat.pendingMessages.hasOwnProperty(room)) {
        chat.pendingMessages[room] = [];
    }
    chat.pendingMessages[room].push({ message, sender, timestamp: new Date() });
};

// Método para obtener y limpiar los mensajes pendientes de una sala
chat.getPendingMessages = function (room) {
    if (!chat.pendingMessages.hasOwnProperty(room)) {
        return [];
    }
    const messages = chat.pendingMessages[room];
    delete chat.pendingMessages[room]; // Limpia los mensajes pendientes
    return messages;
};

module.exports = chat;
