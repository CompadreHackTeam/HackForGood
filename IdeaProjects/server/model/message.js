/**
 * This is the Message for MongoDB in mongoose.Schema
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Message', new Schema({

    geofenceID: String, /* ID de la geofence asociada al mensaje */
    username : String, /* Nombre del usuario que pushea el msg */
    content : String, /* Contenido del mensaje*/
    date : Date

}));