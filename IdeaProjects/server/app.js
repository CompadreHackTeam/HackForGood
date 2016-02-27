/**
 * This is the main app for GeoMessage app.js
 *
 * @type {*|exports|module.exports}
 */
var express                 = require("express"),
    app                     = express(),
    bodyParser              = require("body-parser"),
    methodOverride          = require("method-override"),
    DatabaseManager         = require('./manager/databasemanager.js'),
    Geofence                = require('./model/geofence'),                // get our mongoose model image
    Message                 = require('./model/message'),
    OpendataGeofenceBus     = require('./model/opendataGeofenceBus'),
    OpendataGeofenceTaxi    = require('./model/opendataGeofenceTaxi'),
    mainController          = require('./controller/maincontroller'),
    config                  = require('./server.properties'),
    auth                    = require("http-auth");


// Create the database connection
DatabaseManager.connectDB();

// Middlewares
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(methodOverride());

app.use(express.static(__dirname + "/public/"));

//  Setting in geomessage.properties file the global security, in server.auth the authentication data
if (config.globalsecurity) {
    var basic = auth.basic({
        realm: "Backend Area.",
        file: './server.auth'
    });
    app.use(auth.connect(basic));
}

// API routes
var controller = express.Router();

controller.route('/upload')
    .post(mainController.upload);

controller.route('/download')
    .get(mainController.download);

controller.route('/delete')
    .delete(mainController.delete);

controller.route('/deleteAll')
    .get(mainController.deleteAll);

controller.route('/putMsg')
    .post(mainController.putMsg);

controller.route('/putMsgJSON')
    .post(mainController.putMsgJSON);

controller.route('/getMsg')
    .get(mainController.getMsg);

controller.route('/getMsg/:geoID')
    .get(mainController.getMsgParam);

controller.route('/requestOpenDataBus')
    .get(mainController.requestOpenDataBus);

controller.route('/deleteOpenDataBus')
    .get(mainController.deleteOpenDataBus);

controller.route('/requestOpenDataTaxi')
    .get(mainController.requestOpenDataTaxi);

controller.route('/deleteOpenDataTaxi')
    .get(mainController.deleteOpenDataTaxi);

controller.route('/getTagList')
    .get(mainController.getTagList);

app.use(controller);
// Add /api after port and before the methods of route
app.use('/api', controller);

// Start server
app.listen(config.port, function () {
    console.log("*** Servidor corriendo en " + config.port);
});