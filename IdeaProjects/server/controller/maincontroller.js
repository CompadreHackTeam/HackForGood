/**
 * MAIN CONTROLLER FOR SERVER
 */
var mongoose                = require('mongoose');
var Geofence                = mongoose.model('Geofence');
var Message                 = mongoose.model('Message');
var OpendataGeofenceBus     = mongoose.model('OpendataGeofenceBus');
var OpendataGeofenceTaxi    = mongoose.model('OpendataGeofenceTaxi');

var formidable = require("formidable");
var util = require('util');
var request = require("request");

/**
 * PUT GEOFENCE
 * Put a geofence
 * POST - UPLOAD */
exports.upload = function (req, res) {

    var form = new formidable.IncomingForm();
    // A parse se le pasa la request del cliente en req y nos devuelve los campos del formulario
    // en fields, crearemos el nuevo objeto a partir de los campos enviados en el formulario
    form.parse(req, function (err, fields, files) {

        // Se crea un objeto Geofence
        var geofence = new Geofence({
            latitude: fields.latitude,
            longitude: fields.longitude,
            radius: fields.radius,
            name: fields.name,
            tag: fields.tag
        });

        // Se guarda el objeto geofence
        geofence.save(function (err) {

            // res es la respuesta que se envia al cliente, lo rellenamos con los datos que queramos
            res.writeHead(200, {'content-type': 'text/plain'});
            res.write('Guardado en MongoDB  :\n\n');
            res.end(util.inspect({
                fields: fields
            }));
        });
    });
};

/**
 * *** GET GEOFENCE ***
 *  Gets all the geofences
 *  GET - DOWNLOAD */
exports.download = function (req, res) {
    // Find all geofences
    Geofence.find({}, function (err, geofences) {
        if (err != null) {
            res.send("Error :" + err)
            res.end();
        } else {
            // Enviamos
            res.send(geofences);
        }
    });
};

/**
 * *** GET GEOFENCE BY TAG ***
 *  Gets by tag all geofences
 *  GET - DOWNLOAD BY TAG
 *  */
exports.downloadByTag = function (req, res) {
    // Find all geofences
    console.log("errersddfs");
    //res.send("tagId is set to " + req.params.tag);

    var tag = req.params.tag;
    console.log(tag);
    Geofence.find({tag: tag}, function (err, geofence) {
        if (err != null) {
            res.send("Error: " + err);
            res.send();
        } else {
            res.send(geofence);
        }
    })
};

/**
 * *** DELETE GEOFENCE:ID ***
 * Delete the param : geoID geofence
 * PUT - DELETE
 */
exports.delete = function (req, res) {

    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

        console.log("Delete: " + fields.geoID);
        /* Borramos la geofence asociada al id */
        Geofence.findOneAndRemove({'_id': fields.geoID}, function (err, result) {
            if (result == null) {
                res.status(404).json({error: "Not found"});
            } else {

                /* Ahora borramos los mensajes asociados a la geofence */
                Message.remove({geofenceID: fields.geoID}, function (err, result) {
                });
                res.status(200).json({status: "Geofence deleted"});
            }
        });
    })
}

/**
 * *** DELETE ALL GEOFENCE ***
 * DELETE ALL GEOFENCES IN MONGODB
 */
exports.deleteAll = function (req, res) {

    Geofence.remove({}, function (err, result) {
        if (result == null) {
            res.status(404).json({error: "Not found"});
        } else {

           res.status(200).json({status: "All geofences deleted"});
        }
    });
}

/**
 * *** PUT MESSAGE ***
 * POST - putMsg
 * Put a message in a geofence
 * */
exports.putMsg = function (req, res) {

    //Declaramos el formulario
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

        //Creamos el objeto mensaje
        var message = new Message({
            geofenceID: fields.geoID,
            username: fields.userName,
            content: fields.msg,
            date: new Date()


        });
        //guardamos el objeto message
        message.save(function (err, message) {
            if (err != null) {
                res.send("Error: " + err);
                res.send();
            } else {
                res.send(message);
            }
        });
    })
}

/**
 * *** PUT MESSAGE JSON ***
 * POST - putMsg
 * Put a message in JSON format
 * */
exports.putMsgJSON = function (req, res) {
    console.log("putMsgJSON");

    var jsonMsg = req.body;
    var message = new Message({
        geofenceID : jsonMsg.geofenceID,
        username : jsonMsg.username,
        content : jsonMsg.content,
        date : new Date()
    })
    //guardamos el objeto message
    message.save(function (err, message) {
        if (err != null) {
            res.send("Error: " + err);
            res.send();
        } else {
            res.send(message);
        }
    });
}

/**
 * *** GET/geoID MESSAGE ***
 * GET - getMSG/geoID
 * Gets all messages from an especific geofence
 * */
exports.getMsgParam = function (req, res) {
    var geoIDparam = req.params.geoID;
    Message.find({geofenceID: geoIDparam}, function (err, message) {
        if (err != null) {
            res.send("Error: " + err);
            res.send();
        } else {
            res.send(message);
        }
    })
}

/**
 * *** getMsg ***
 * GET - getMSG
 * Gets all messages
 * */
exports.getMsg = function (req, res) {
    //Encuentra todos los mensajes
    Message.find({}, function (err, message) {
        if (err != null) {
            res.send("Error: " + err)
            res.send();
        } else {
            res.send(message);
        }
    });

};

/**
 * *** requestOpenDataBus ***
 * Gets bus stops from opendatacc and saves in mongoDB as geofence.
 * (if exists any previous version, delete and save again)
 * url : http://opendata.caceres.es/toJSON/JSON?uri=http://opendata.caceres.es/sparql?default-graph-uri=&query=select+%3FURI_stop+%3Ffoaf_name+%3Fgeo_lat+%3Fgeo_long+where%7B%0D%0A++%3FURI_stop+a+gtfs%3AStop+.%0D%0A++%3FURI_stop+foaf%3Aname+%3Ffoaf_name+.%0D%0A++%3FURI_stop+geo%3Alat+%3Fgeo_lat+.%0D%0A++%3FURI_stop+geo%3Along+%3Fgeo_long+.+%0D%0A+%7D&format=json
 */
exports.requestOpenDataBus = function (req, res) {

    OpendataGeofenceBus.count(function(err,count){
        if(count == 0){ // If the collection is empty downloads and saves
            console.log("Numero de elementos en la colección: " + count);
            console.log("Colección opendatageofences vacía, inicializando...");
            /*Esta es la url de las paradas de autobus*/
            var url = 'http://opendata.caceres.es/toJSON/JSON?uri=http://opendata.caceres.es/sparql?default-graph-uri=&query=select+%3FURI_stop+%3Ffoaf_name+%3Fgeo_lat+%3Fgeo_long+where%7B%0D%0A++%3FURI_stop+a+gtfs%3AStop+.%0D%0A++%3FURI_stop+foaf%3Aname+%3Ffoaf_name+.%0D%0A++%3FURI_stop+geo%3Alat+%3Fgeo_lat+.%0D%0A++%3FURI_stop+geo%3Along+%3Fgeo_long+.+%0D%0A+%7D&format=json';

            request(url, function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    var opendataBus = JSON.parse(body);
                    getOpenDataGeofencesBus(opendataBus); //Función que procesa y guarda el contenido de opendata en mongo

                    OpendataGeofenceBus.find({}, function (err, geofencesBus) {
                        if (err != null) {
                            res.send("Error :" + err)
                            res.end();
                        } else {
                            // Enviamos
                            res.send(geofencesBus);
                        }
                    });
                } else {
                    console.log("Got an error: " + err);
                    res.send("Error: " + err)
                    res.send();
                }
            });
        }else{
            console.log("Numero de elementos en la colección: " + count);
            //Hay elementos en la colección, los devolvemos
            OpendataGeofenceBus.find({}, function (err, geofencesBus) {
                if (err != null) {
                    res.send("Error :" + err)
                    res.end();
                } else {
                    // Enviamos
                    res.send(geofencesBus);
                }
            });
        }
    });
};

/**
 * *** processOpendata ***
 * @param opendataBus, JSON object
 * Process opendata fields and saves as (opendata)GeofenceBus
 */
function getOpenDataGeofencesBus(opendataBus) {
    console.log("Entrando en getOpenDataGeofencesBus");

    for (var i in opendataBus.results.bindings) {
        var opendatageofenceBus = new OpendataGeofenceBus({ /*ñapa rapida para verlo en el mapa es sustituir opendatageofence por geofence y a cascarla*/
            latitude: opendataBus.results.bindings[i].geo_lat.value,
            longitude: opendataBus.results.bindings[i].geo_long.value,
            radius: 50,
            name: opendataBus.results.bindings[i].foaf_name.value /*Con los autobuses funciona así, con los taxis está por ver*/
        });

        opendatageofenceBus.save(function(err){
            if(err){
                console.log("Got an error trying to save object OPENDATAGEOFENCEBus in mongo: " + err);
                res.send("Error saving opendatageofenceBus in mongo: " + err)
                res.send();
            }
        })
    }
}

/**
 * deleteOpenDataBus
 * Deletes all documents of the collection OpendataGeofenceBus
 */
exports.deleteOpenDataBus = function(req, res){
    console.log("Deleting all opendata Bus Geofences");
    OpendataGeofenceBus.remove({}, function (err, result) {});
    res.status(200).json({status: "All OpendataGeofencesBus deleted"});
};

/**
 * *** requestOpenDataBus ***
 * Gets bus stops from opendatacc and saves in mongoDB as geofence.
 * (if exists any previous version, delete and save again)
 * url : http://opendata.caceres.es/toJSON/JSON?uri=http://opendata.caceres.es/sparql?default-graph-uri=&query=select+%3FURI_stop+%3Ffoaf_name+%3Fgeo_lat+%3Fgeo_long+where%7B%0D%0A++%3FURI_stop+a+gtfs%3AStop+.%0D%0A++%3FURI_stop+foaf%3Aname+%3Ffoaf_name+.%0D%0A++%3FURI_stop+geo%3Alat+%3Fgeo_lat+.%0D%0A++%3FURI_stop+geo%3Along+%3Fgeo_long+.+%0D%0A+%7D&format=json
 * url con nombres : http://opendata.caceres.es/sparql?default-graph-uri=&query=select+*+where%7B%0D%0A%3Furi+a+om%3AParadaTaxi.%0D%0A%3Furi+om%3AsituadoEnVia+%3Fvia.%0D%0A%3Fvia+om%3AnombreVia+%3Fnvia.%0D%0A%3Fvia+om%3AtipoVia+%3Ftvia.%0D%0A%7D&format=json
 */
exports.requestOpenDataTaxi = function (req, res) {

    OpendataGeofenceTaxi.count(function(err,count){
        if(count == 0){ // If the collection is empty downloads and saves
            console.log("Numero de elementos en la colección: " + count);
            console.log("Colección opendatageofences vacía, inicializando...");

            var url = 'http://opendata.caceres.es/toJSON/JSON?uri=http://opendata.caceres.es/sparql?default-graph-uri=&query=Select+%3Fom_situadoEnVia+%3Fgeo_lat+%3Fgeo_long%0D%0AWhere{%0D%0A%3FURI+a+om%3AParadaTaxi.%0D%0A%3FURI+om%3AsituadoEnVia+%3Fom_situadoEnVia.%0D%0A%3FURI+schema%3Atelephone+%3Fschema_telephone.%0D%0A%3FURI+geo%3Alat+%3Fgeo_lat.%0D%0A%3FURI+geo%3Along+%3Fgeo_long.%0D%0A%3FURI+schema%3Aurl+%3Fschema_url.%0D%0A}&format=json'
            request(url, function (err, response, body) {/*Request datos de latitutd y longitud*/
                if (!err && response.statusCode == 200) {/*Si bien*/
                    var urlName = 'http://opendata.caceres.es/sparql?default-graph-uri=&query=select+*+where%7B%0D%0A%3Furi+a+om%3AParadaTaxi.%0D%0A%3Furi+om%3AsituadoEnVia+%3Fvia.%0D%0A%3Fvia+om%3AnombreVia+%3Fnvia.%0D%0A%3Fvia+om%3AtipoVia+%3Ftvia.%0D%0A%7D&format=json';
                    request(urlName, function(err, response, names){/*Request de los nombres de las paradas*/
                        var taxiStopName = JSON.parse(names);
                        var opendataTaxi = JSON.parse(body);
                        getOpenDataGeofencesTaxi(taxiStopName, opendataTaxi); //Función que procesa y guarda el contenido de opendata en mongo

                        OpendataGeofenceTaxi.find({}, function (err, geofencesTaxi) {
                            if (err != null) {
                                res.send("Error :" + err)
                                res.end();
                            } else {
                                // Enviamos
                                res.send(geofencesTaxi);
                            }
                        });

                    }); //requestNames

                } else {
                    console.log("Got an error: " + err);
                    res.send("Error: " + err)
                    res.send();
                }
            }); //requestLatLong
        }else{
            console.log("Numero de elementos en la colección: " + count);
            //Hay elementos en la colección, los devolvemos
            OpendataGeofenceTaxi.find({}, function (err, geofencesTaxi) {
                if (err != null) {
                    res.send("Error :" + err)
                    res.end();
                } else {
                    // Enviamos
                    res.send(geofencesTaxi);
                }
            });
        }
    });
};

/**
 * *** processOpendata ***
 * @param opendataTaxi, JSON object
 * Process opendata fields and saves as (opendata)GeofenceTaxi
 */
function getOpenDataGeofencesTaxi(taxiStopName, opendataTaxi) {
    console.log("Entrando en getOpenDataGeofencesTaxi");

    for (var i in opendataTaxi.results.bindings) {
        var nameStop = taxiStopName.results.bindings[i].tvia.value + " " + taxiStopName.results.bindings[i].nvia.value;
        console.log(nameStop);
        var opendatageofenceTaxi = new OpendataGeofenceTaxi({ /*ñapa rapida para verlo en el mapa es sustituir opendatageofence por geofence y a cascarla*/
            latitude: opendataTaxi.results.bindings[i].geo_lat.value,
            longitude: opendataTaxi.results.bindings[i].geo_long.value,
            radius: 50,
            name: nameStop
        });

        opendatageofenceTaxi.save(function(err){
            if(err){
                console.log("Got an error trying to save object OPENDATAGEOFENCEBus in mongo: " + err);
                res.send("Error saving opendatageofenceBus in mongo: " + err)
                res.send();
            }
        })
    }
}

/**
 * deleteOpenDataTaxi
 * Deletes all documents of the collection OpendataGeofenceTaxi
 */
exports.deleteOpenDataTaxi = function(req, res){
    console.log("Deleting all opendata Taxi Geofences");
    OpendataGeofenceTaxi.remove({}, function (err, result) {});
    res.status(200).json({status: "All OpendataGeofencesTaxi deleted"});
};

/**
 * getTagList, returns a complete list of the tags avaible in geofences
 * GET - GetTagList
 */
exports.getTagList = function(req, res){
    Geofence.find({}, function (err, tags) {

        var result = [];
        //tags contiene la lista completa de los geofences, con undefined y mierdas
        for (var i in tags) {
            if (tags[i].tag != undefined) {//si el tag de la geofence está definido
                //var element = tags[i].tag;
                    result.push(tags[i].tag);
            }
        }
        for (var i in result){
            for (var j in result){
                if(result[i] === result[j]){
                    result.splice(j, 1);
                }
            }
        }

        if (err != null) {
            res.send("Error: " + err);
            res.send();
        } else {
            res.contentType('application/json');
            res.send(JSON.stringify(result));
        }
    })
}
