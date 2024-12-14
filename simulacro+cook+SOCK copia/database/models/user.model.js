const bcrypt = require('bcrypt');

users = {};

users.data = {};

users.generateHash = function(password, callback){
    bcrypt.hash(password, 10, callback);
}

users.comparePass = async function(password, hash){
    return await bcrypt.compare(password, hash);
}

users.register = function(username, password){
    if(users.data.hasOwnProperty(username)){
        throw new Error(`Ya existe el usuario ${username}.`);
    }
    users.generateHash(password, function(err, hash){
        if(err){
            throw new Error(`Error al generar el hash de ${username}.`);
        }
        users.data[username] = {username, hash, last_Login: new Date().toISOString,
            cookiesAccepted: false, // Agregamos esta propiedad
            
        }; 
    });
};

users.isLoginRight = async function(username, password){
    if(!users.data.hasOwnProperty(username)){
        return false;
    }
    return await users.comparePass(password, users.data[username].hash);
}


// Método para marcar cookies como aceptadas
users.acceptCookies = function (username) {
    if (!users.data.hasOwnProperty(username)) {
        throw new Error(`El usuario ${username} no existe.`);
    }
    users.data[username].cookiesAccepted = true;
};

// Método para verificar si las cookies han sido aceptadas
users.hasAcceptedCookies = function (username) {
    if (!users.data.hasOwnProperty(username)) {
        return false;
    }
    return users.data[username].cookiesAccepted;
};

module.exports = users;