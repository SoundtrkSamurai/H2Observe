(function () {
    "use strict";

    angular.module("myapp.controllers", [])

    .controller("appController", [function () {
        var controller = this;
        controller.companyName = 'H2Observe';
        controller.mapWidth = $('ion-content').css('width');
        controller.mapHeight = $('ion-content').css('height');
    }])

    //homeCtrl provides the logic for the home screen
    .controller("homeCtrl", ["$scope", "$state", function ($scope, $state) {
        $scope.refresh = function () {
            //refresh binding
            $scope.$broadcast("scroll.refreshComplete");
        };
    }])

    .controller('mapController', ['$http', '$log', '$state', '$ionicLoading', '$cordovaGeolocation', 'leafletData',
        function ($http, $log, $state, $ionicLoading, $cordovaGeolocation, leafletData) {

        $log.log('-> mapController');
        var controller = this;
        controller.currentLocation;

        // Set center of map on first run through
        if (!controller.center) {
            angular.extend(controller, {
                center: {
                    lat: 47.6487,
                    lng: -122.1168,
                    zoom: 10
                }
            });
        }

        controller.findMe = function () {
            leafletData.getMap('mymap')
            .then(function (map) {
                if (controller.currentLocation) {
                    map.setView(controller.currentLocation, 15);
                }
            });
        };
            // Get initial location
        controller.initialize = function () {
            leafletData.getMap('mymap')
            .then(function (map) {
                L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                    maxZoom: 20,
                    id: 'soundtrksamurai.pm2fphn7',
                    accessToken: 'pk.eyJ1Ijoic291bmR0cmtzYW11cmFpIiwiYSI6ImNpbXlnb2JrZjA0MjJ1d200eTB2YjlnOG8ifQ.VQrBuf4kLiRrHj1v884qJw'
                }).addTo(map);
                var lc = L.control.locate({ drawCircle: false, locateOptions: { enableHighAccuracy: true } }).addTo(map);
                map.removeControl(map.zoomControl);
                lc.start();
                $ionicLoading.show({ template: 'Tracing current location...' });
                map.on('locationfound', function (e) {
                    controller.currentLocation = e.latlng;
                    $ionicLoading.hide();
                });
            });
            //controller.GetGeoLocation = function () {
            //    $log.log('Tracing current location...');
            //    $ionicLoading.show({
            //        template: 'Tracing current location...'
            //    });
            //    $cordovaGeolocation.getCurrentPosition()
            //        .then(function (position) {
            //            $log.log('Current location found');
            //            $log.log('Current location Latitude' + position.coords.latitude);
            //            $log.log('Current location Longitude' + position.coords.longitude);
            //            $ionicLoading.hide();
            //            angular.extend(controller, {
            //                center: {
            //                    lat: position.coords.latitude,
            //                    lng: position.coords.longitude,
            //                    zoom: 8
            //                },
            //                markers: {
            //                    marker: {
            //                        lat: position.coords.latitude,
            //                        lng: position.coords.longitude,
            //                        draggable: false
            //                    }
            //                }
            //            });
            //            controller.latLang.lat = parseFloat(position.coords.latitude);
            //            controller.latLang.lang = parseFloat(position.coords.longitude);
            //            var lat = controller.latLang.lat;
            //        });
            //};
        };
        
        controller.initialize();
    }])

    .controller('bluetoothController', ['$cordovaBluetoothLE', function ($cordovaBluetoohLE) {
        var controller = this;
        ionic.Platform.ready(function () {
            $cordovaBluetoohLE.initialize({ request: true })
            .then(null,
            function (obj) { },
            function (obj) { });
        });
    }])

    //errorCtrl managed the display of error messages bubbled up from other controllers, directives, myappService
    .controller("errorCtrl", ["$scope", "myappService", function ($scope, myappService) {
        //public properties that define the error message and if an error is present
        $scope.error = "";
        $scope.activeError = false;

        //function to dismiss an active error
        $scope.dismissError = function () {
            $scope.activeError = false;
        };

        //broadcast event to catch an error and display it in the error section
        $scope.$on("error", function (evt, val) {
            //set the error message and mark activeError to true
            $scope.error = val;
            $scope.activeError = true;

            //stop any waiting indicators (including scroll refreshes)
            myappService.wait(false);
            $scope.$broadcast("scroll.refreshComplete");

            //manually apply given the way this might bubble up async
            $scope.$apply();
        });
    }]);
})();