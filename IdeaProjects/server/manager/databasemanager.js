/**
 * DATABASE MANAGER
 */
var mongoose    = require('mongoose');
var config      = require('../server.properties');

module.exports = {
    connectDB: function () {
        // Create the database connection
        mongoose.connect(config.mongodburi);

        // CONNECTION EVENTS
        // When successfully connected
        mongoose.connection.on('connected', function () {
            console.log('*** Conectado a MongoDB en ' + config.mongodburi);
        });

        // If the connection throws an error
        mongoose.connection.on('error', function (err) {
            console.log('*** Error conectando a MongoDB, ¿ está el demonio mongod corriendo ? (tip: $ps aux | grep mongod ), ERROR : ' + err);
        });
    }
};
