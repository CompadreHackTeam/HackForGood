/**
 * Created by Estevez on 23/02/2016.
 */
var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var labelIndex = 0;
/** Empty list for markers to get reference to the old objects */
var markers = [];
var map;
var interestedPointControl;
var interestedPointsDiv
var lastMarker;
var myList = [];
var image;
$(document).ready(function () {
    google.maps.event.addListener(markers, "click", function (event) {
        alert(this.position);
    });


    //Generate tooltips over the buttons with info
    $('.limpiar').qtip({ // Grab some elements to apply the tooltip to

        style: {
            classes: 'qtip-bootstrap',

        },
        content:  '<h4 class="margin-left-15 col-sm-12 tooltipOpenData">Clean</h4><i onclick="hdlClean()" class="margin-left-40 fa fa-trash-o fa-3x cursor-pointer"></i>',
        position: {
            my: 'top center',  // Position my top left...
            at: 'bottom left', // at the bottom right of...
            target: $('.limpiar'), // my target
            adjust: {
                x:20
            }
        },
        hide:{ //moved hide to here,
            delay:300, //give a small delay to allow the user to mouse over it.
            fixed:true
        }
    })

    $('.opendata').qtip({ // Grab some elements to apply the tooltip to

        style: {
            classes: 'qtip-bootstrap',

        },
        content:  '<h3 class="col-sm-12 tooltipOpenData">OpenData</h3><row><div><i onclick="hdlCargarOpenDataTaxi()" class="fa fa-car fa-3x pull-left cursor-pointer"></i><i onclick="hdlCargarOpenDataBus()" class="fa fa-bus fa-3x pull-right cursor-pointer"></i></div>'
            /*
            text: function(api){
                $(this).next('.tooltiptextOpendata').removeClass("hidden")
                return $(this).next('.tooltiptextOpendata');
            },*/,
        position: {
            my: 'top right ',  // Position my top left...
            at: 'bottom left', // at the bottom right of...
            target: $('.opendata'), // my target
            adjust: {
                x:30
            }
        },

        hide:{ //moved hide to here,
            delay:300, //give a small delay to allow the user to mouse over it.
            fixed:true
        },
    })



    $("#createGeofenceForm").submit(function (event) {

        // get the form data
        // there are many ways to get this data using jQuery (you can use the class or id also)
        /*     var formData = {
         'latitude': $('input[name=latitude]').val(),
         'longitude': $('input[name=longitude]').val(),
         'radius': $('input[name=radius]').val(),
         'name': $('input[name=name]').val()

         };*/

        var form = new FormData();
        form.append("latitude", $('input[name=latitude]').val());
        form.append("longitude", $('input[name=longitude]').val());
        form.append("radius", $('input[name=radius]').val());
        form.append("name", $('input[name=name]').val());
        form.append("tag", $('.seleccionado option:selected').html() );



        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "/api/upload",
            "method": "POST",
            "headers": {
                "cache-control": "no-cache",
                "postman-token": "b70b4e46-813d-6628-a722-9bed2d6c88e9"
            },
            "processData": false,
            "contentType": false,
            "mimeType": "multipart/form-data",
            "data": form
        }

        $.ajax(settings).done(function (response) {
            $('#myModal').modal('hide');
            lastMarker=0;
            getAllGeofencesFromServer();
        });

    });
});
/*INICIALIZA EL MAPA*/
function initialize() {

    $(".chosen").chosen({

        no_results_text: "Oops, nothing found!",
        width: "100%"
    });

    $(document).on("click",".close",function(){
        lastMarker.setMap(null);
    });

    $(document).on("click","#closeModal",function(){
        lastMarker.setMap(null);
    });


    /*
    $(document).on("click",".googleMap",function(){
        console.log("Hola");
        alert("Hola");

    });*/
    /*PROPIEDADES INICIALES DEL MAPA*/
    var mapProp = {
        center: new google.maps.LatLng(39.478850, -6.342475),
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var marker = new google.maps.Marker({});

    map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

    /*
     interestedPointsDiv = document.createElement('div');
     interestedPointControl = new InterestedPoints(interestedPointsDiv, map);
     map.controls[google.maps.ControlPosition.TOP_RIGHT].push(interestedPointsDiv);
     */
    /*LISTENER DEL EVENTO CLICK EN EL MAPA*/
    google.maps.event.addListener(map, 'click', function (event) {
        $('#myModal').modal('show');
        paintMarker(createMarkerFromLatLng(event.latLng));
        document.getElementById("latitude").value = event.latLng.lat();
        document.getElementById("longitude").value = event.latLng.lng();
    });

    /*LISTENER DEL EVENTO CLICK EN UN MARKER*/
    google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
    });

    getAllGeofencesFromServer();
}


/** PINTA PUNTOS DE INTERÉS
 *
 * @param controlDiv    Target div to draw
 * @param map           Map instance
 * @constructor

 function InterestedPoints(controlDiv) {
    controlDiv.style.padding = '5px';
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = 'yellow';
    controlUI.style.border = '1px solid';
    controlUI.style.cursor = 'pointer';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Set map to London';
    controlDiv.appendChild(controlUI);
    var controlText = document.createElement('div');
    controlText.style.fontFamily = 'Arial,sans-serif';
    controlText.style.fontSize = '12px';
    controlText.style.paddingLeft = '4px';
    controlText.style.paddingRight = '4px';
    controlText.innerHTML = '<b>Interested Points<b>'
    controlUI.appendChild(controlText);
    var pos = new google.maps.LatLng(39.494119, -6.371561);
    var pos2 = new google.maps.LatLng(39.490559, -6.366915);
    google.maps.event.addDomListener(controlUI, 'click', function () {
        paintMarker(map, pos);
        paintMarker(map, pos2);
    });
}
 */

/**
 * This method get from the server al geofences
 */
function getAllGeofencesFromServer() {

    //setMapOnAll(null);
    removeMarkers();

    $.ajax({
        type: "GET",
        url: "/api/download",
        dataType: "json",
        cache: false,
        contentType: "application/json",
        success: function (data) {
            drawGeofencesList(data);
        },
        error: function (xhr, status, error) {
            alert(xhr.status);
        }
    });
}

/**
 * Este metodo recibe un array de objetos de json
 *
 * @param data el array de objetos
 */
function drawGeofencesList(data) {

    $.each(data, function (index, jsonMarker) {
        try {
            var myLatlng = {lat: jsonMarker.latitude.valueOf(), lng: jsonMarker.longitude.valueOf()};
        } catch (e) {
        }

        var marker = createMarkerFromLatLng(myLatlng);
        // Paint the created marker
        paintMarker(marker);
        // We fill a new cirlce with the created marker and draw it in the map
        createCircleAndInflate(jsonMarker.radius, marker);
    });
}
function drawGeofencesListImage(data,image) {

    $.each(data, function (index, jsonMarker) {
        try {
            var myLatlng = {lat: jsonMarker.latitude.valueOf(), lng: jsonMarker.longitude.valueOf()};
        } catch (e) {
        }

        var marker = createMarkerFromLatLngImg(myLatlng,image);

        // Paint the created marker
        paintMarker(marker);
        // We fill a new cirlce with the created marker and draw it in the map
        createCircleAndInflate(jsonMarker.radius, marker);
    });
}
/**
 * Pinta un marker en el mapa
 * @param marker    el objeto marker
 */
function paintMarker(marker) {
    // Put the marker on the map
    marker.setMap(map);
}

/**
 * Crea un nuevo marker a partir de un objeto position
 * @param position  el objeto position
 * @returns {google.maps.Marker|*}
 */
function createMarkerFromLatLng(position) {
    // Creates a new marker
    var marker = new google.maps.Marker({
        position: position,
        animation: google.maps.Animation.BOUNCE,

    });

    //Store the last marker to delete
    lastMarker = marker;

    markers.push(marker);
    return marker;
}
function createMarkerFromLatLngImg(position,image) {
    // Creates a new marker
    var marker = new google.maps.Marker({
        position: position,
        animation: google.maps.Animation.BOUNCE,

    });
    marker.setIcon(image);
    //Store the last marker to delete
    lastMarker = marker;

    markers.push(marker);
    return marker;
}

function removeMarkers() {

    for (j = 0; j < myList.length; j++) {
         myList[j].setMap(null);
    };
    for (i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    };

}

function createCircleAndInflate(radius, marker) {
    //Create variable to fill the color random
    var color = '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6);

    var circle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.7,
        map: map,
        center: marker.center,
        radius: radius
    });

  /*  console.log("Metiendo en la lista de circulos");
    myList.push(circle);*/

    circle.bindTo('center', marker, 'position');
    //Store my circles so we can delete them later
    myList.push(circle);
}

function createGeofence() {


}
function hdlClean(){
    removeMarkers();
    /*console.log(myList.length);
    for (var j = 0; j < myList.length; i++) {
        myList[i].setMap(null);;
    }*/
}

/**
 * Get all the Taxi stops from the server and paint them
 */
function hdlCargarOpenDataTaxi(){
    removeMarkers();

    image = './images/LogoP.png';
    $.ajax({
        type: "GET",
        url: "/api/requestOpenDataTaxi",
        dataType: "json",
        cache: false,
        contentType: "application/json",
        success: function (data) {
            drawGeofencesListImage(data,image);
        },
        error: function (xhr, status, error) {
            alert(xhr.status);
        }
    });
}
function hdlCargarOpenDataBus(){
    removeMarkers();

    image = './images/LogoP.png';
    $.ajax({
        type: "GET",
        url: "/api/requestOpenDataBus",
        dataType: "json",
        cache: false,
        contentType: "application/json",
        success: function (data) {
            drawGeofencesListImage(data,image);
        },
        error: function (xhr, status, error) {
            alert(xhr.status);
        }
    });
}







