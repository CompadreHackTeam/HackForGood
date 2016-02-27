/**
 * IMAGE OBJECT
 *
 * This is the Geofence for MongoDB in mongoose.Schema
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Geofence', new Schema({

    latitude: Number,
    longitude: Number,
    radius: Number,
    name: String,
    tag : String

}));