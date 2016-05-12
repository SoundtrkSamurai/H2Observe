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

    .controller('mapController', ['$http', '$state', '$ionicLoading', '$cordovaGeolocation', 'leafletData',
        function ($http, $state, $ionicLoading, $cordovaGeolocation, leafletData) {

        // $log.log('-> mapController');
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
            //    // $log.log('Tracing current location...');
            //    $ionicLoading.show({
            //        template: 'Tracing current location...'
            //    });
            //    $cordovaGeolocation.getCurrentPosition()
            //        .then(function (position) {
            //            // $log.log('Current location found');
            //            // $log.log('Current location Latitude' + position.coords.latitude);
            //            // $log.log('Current location Longitude' + position.coords.longitude);
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

    .controller('bluetoothController', ['$cordovaBluetoothLE', '$ionicPlatform', '$ionicLoading', '$state', '$rootScope', function ($cordovaBluetoothLE, $ionicPlatform, $ionicLoading, $state, $rootScope) {
        var controller = this;

        function startScan() {
            if (window.cordova.platformId === 'windows') {
                $rootScope.retrieveConnected();
            } else {
                $rootScope.startScan();
            }
        }

        function addDevice(result) {
            if ($rootScope.devices[result.address] !== undefined) {
                return false;
            } else {
                result.services = {};
                $rootScope.devices[result.address] = result;
            }
        }

        function stopScan() {
            $rootScope.stopScan();
        }

        function getDeviceServices(address) {

            // log("Getting device services...", "status");
            var platform = window.cordova.platformId;
            if (platform === "android") {
                $rootScope.discover(address);
            }
            else if (platform === "windows") {
                $rootScope.services(address);
            }
            else {
                // log("Unsupported platform: '" + window.cordova.platformId + "'", "error");
            }
        }

        function stopScan() {
            $rootScope.stopScan();
        }

        function stopScanSuccess() {

            if (!foundDevices.length) {

                log("NO DEVICES FOUND");
            }
            else {

                log("Found " + foundDevices.length + " devices.", "status");
            }
        }     

        function addService(service, device) {
            if (device.services[service.uuid] !== undefined) {
                return;
            }
            device.services[service.uuid] = { uuid: service.uuid, characteristics: {} };
        }

        function addCharacteristic(characteristic, service) {
            if (service.characteristics[characteristic.uuid] !== undefined) {
                return;
            }
            service.characteristics[characteristic.uuid] = { uuid: characteristic.uuid, descriptors: {}, properties: characteristic.properties };
        }

        function addDescriptor(descriptor, characteristic) {
            if (characteristic.descriptors[descriptor.uuid] !== undefined) {
                return;
            }
            characteristic.descriptors[descriptor.uuid] = { uuid: descriptor.uuid };
        }

        controller.clear = function () {
            for (var address in $rootScope.devices) {
                if ($rootScope.devices.hasOwnProperty(address)) {
                    $cordovaBluetoothLE.close({ address: address });
                }
            }
            $rootScope.devices = {};
        };

        controller.delete = function (address) {
            $cordovaBluetoothLE.close({ address: address });
            delete $rootScope.devices[address];
        };

        controller.goToDevice = function (device) {
            $state.go("tab.device", { address: device.address });
        };

        controller.connect = function (address) {

            // log('Connecting to device: ' + address + "...", "status");
            if (cordova.platformId === "windows") {
                getDeviceServices(address);
            }
            else {
                stopScan();
                $rootScope.connect(address);
            }
        }

        $rootScope.devices = {};

        $rootScope.connect = function (address) {
            var params = { address: address, timeout: 10000 };

            //Log.add("Connect : " + JSON.stringify(params));

            $cordovaBluetoothLE.connect(params)
            .then(null,
            function (obj) {
                //Log.add("Connect Error : " + JSON.stringify(obj));
                $rootScope.close(address); //Best practice is to close on connection error
            },
            function (result) {
                //Log.add("Connect Success : " + JSON.stringify(obj));
                if (result.status === "connected") {
                    getDeviceServices(result.address);
                }
                else if (result.status === "disconnected") {
                    // log("Disconnected from device: " + result.address, "status");
                }
            });
        };

        $rootScope.discover = function (address) {
            var params = {
                address: address,
                timeout: 10000
            };

            // Log.add("Discover : " + JSON.stringify(params));
            $cordovaBluetoothLE.discover(params)
            .then(
                function (obj) {
                    //Log.add("Discover Success : " + JSON.stringify(obj));
                    var device = $rootScope.devices[obj.address];
                    var services = obj.services;

                    for (var i = 0; i < services.length; i++) {
                        var service = services[i];
                        addService(service, device);

                        var serviceNew = device.services[service.uuid];
                        var characteristics = service.characteristics;

                        for (var j = 0; j < characteristics.length; j++) {
                            var characteristic = characteristics[j];
                            addCharacteristic(characteristic, serviceNew);
                            var characteristicNew = serviceNew.characteristics[characteristic.uuid];
                            var descriptors = characteristic.descriptors;
                            for (var k = 0; k < descriptors.length; k++) {
                                var descriptor = descriptors[k];
                                addDescriptor(descriptor, characteristicNew);
                            }
                        }
                    }
                },
                function (obj) {
                    // Log.add("Discover Error : " + JSON.stringify(obj));
            });
        };

        $rootScope.close = function (address) {
            var params = { address: address };

            Log.add("Close : " + JSON.stringify(params));

            $cordovaBluetoothLE.close(params).then(function (obj) {
                Log.add("Close Success : " + JSON.stringify(obj));
            }, function (obj) {
                Log.add("Close Error : " + JSON.stringify(obj));
            });

            var device = $rootScope.devices[address];
            device.services = {};
        };

        $rootScope.isEmpty = function() {
            if (Object.keys($rootScope.devices).length === 0) {
                return true;
            }
            return false;
        };

        $rootScope.services = function (address) {
            var params = {
                address: address,
                services: [],
                timeout: 5000
            };

            //Log.add("Services : " + JSON.stringify(params));
            $cordovaBluetoothLE.services(params)
            .then(
                function (obj) {
                    //Log.add("Services Success : " + JSON.stringify(obj));
                    var device = $rootScope.devices[obj.address];

                    for (var i = 0; i < obj.services.length; i++) {
                        addService({ uuid: obj.services[i] }, device);

                        var serviceNew = device.services[service.uuid];
                        var characteristics = service.characteristics;

                        for (var j = 0; j < characteristics.length; j++) {
                            var characteristic = characteristics[j];
                            addCharacteristic(characteristic, serviceNew);
                            var characteristicNew = serviceNew.characteristics[characteristic.uuid];
                            var descriptors = characteristic.descriptors;
                            for (var k = 0; k < descriptors.length; k++) {
                                var descriptor = descriptors[k];
                                addDescriptor(descriptor, characteristicNew);
                            }
                        }
                    }
                },
                function (obj) {
                    // Log.add("Services Error : " + JSON.stringify(obj));
                }
            );
        };

        $rootScope.initialize = function() {
            var params = {
                request: true,
                restoreKey: "h2observe-app"
            };

            // $log.log("Initialize : " + JSON.stringify(params));

            $cordovaBluetoothLE.initialize(params).then(null, function(reason) {
                // $log.error("Initialize Error : " + JSON.stringify(reason)); //Should only happen when testing in browser
                

            }, function(result) {
                // $log.log("Initialize Success : " + JSON.stringify(obj));
                if (result.status == 'enabled') {
                    startScan();
                }
            });
        };

        $rootScope.enable = function() {
            // $log.log("Enable");

            $cordovaBluetoothLE.enable().then(null, function(obj) {
                // $log.log("Enable Error : " + JSON.stringify(obj));
            });
        };

        $rootScope.disable = function() {
            // $log.log("Disable");

            $cordovaBluetoothLE.disable().then(null, function(obj) {
                // $log.log("Disable Error : " + JSON.stringify(obj));
            });
        };

        $rootScope.startScan = function() {
            var params = {
                services:[],
                allowDuplicates: false,
                scanTimeout: 15000,
            };

            if (window.cordova) {
                params.scanMode = bluetoothle.SCAN_MODE_LOW_POWER;
                params.matchMode = bluetoothle.MATCH_MODE_STICKY;
                params.matchNum = bluetoothle.MATCH_NUM_ONE_ADVERTISEMENT;
                //params.callbackType = bluetoothle.CALLBACK_TYPE_FIRST_MATCH;
            }

            // $log.log("Start Scan : " + JSON.stringify(params));
            $cordovaBluetoothLE.startScan(params)
                .then(
                function (obj) {
                    // $log.log("Start Scan Auto Stop : " + JSON.stringify(obj));
                },
                function (obj) {
                    // $log.log("Start Scan Error : " + JSON.stringify(obj));
                },
                function (result) {
                    if (result.status == 'scanResult') {
                        // $log.log('Device found : ' + JSON.stringify(obj));
                        addDevice(result);
                    }
                    else if (result.status == 'scanStarted') {
                        // $log.log("Start Scan Success : " + JSON.stringify(obj));
                    }
                }
            );
        };

        $rootScope.stopScan = function() {
            // $log.log("Stop Scan");

            $cordovaBluetoothLE.stopScan()
            .then(
                function (obj) {
                    // $log.log("Stop Scan Success : " + JSON.stringify(obj));
                    if ($rootScope.devices) {
                        // $log.log('NO DEVICES FOUND!');
                    } else {
                        // $log.log('Found ' + $rootScope.devices.length + 'devices.');
                    }
                },
                function (obj) {
                    // $log.log("Stop Scan Error : " + JSON.stringify(obj));
                }
            );
        };

        $rootScope.retrieveConnected = function() {
            var params = {
                services: []
            };

            // $log.log("Retrieve Connected : " + JSON.stringify(params));
            $cordovaBluetoothLE.retrieveConnected(params)
            .then(
                function (result) {
                    // $log.log("Retrieve Connected Success : " + JSON.stringify(obj));
                    _.each(result, function (device) {
                        addDevice(device);
                    });
                },
                function (obj) {
                    // $log.error("Retrieve Connected Error : " + JSON.stringify(obj));
                }
            );
        };

        $rootScope.isInitialized = function() {
            // $log.log("Is Initialized");

            $cordovaBluetoothLE.isInitialized().then(function(obj) {
                // $log.log("Is Initialized Success : " + JSON.stringify(obj));
            });
        };

        $rootScope.isEnabled = function() {
            // $log.log("Is Enabled");

            $cordovaBluetoothLE.isEnabled().then(function(obj) {
                // $log.log("Is Enabled Success : " + JSON.stringify(obj));
            });
        };

        $rootScope.isScanning = function() {
            // $log.log("Is Scanning");

            $cordovaBluetoothLE.isScanning().then(function(obj) {
                // $log.log("Is Scanning Success : " + JSON.stringify(obj));
            });
        };

        $rootScope.discover = function (address) {
            var params = {
                address: address,
                timeout: 10000
            };

            // Log.add("Discover : " + JSON.stringify(params));
            $cordovaBluetoothLE.discover(params)
            .then(
            function (obj) {
                // Log.add("Discover Success : " + JSON.stringify(obj));
                var device = $rootScope.devices[obj.address];
                var services = obj.services;

                for (var i = 0; i < services.length; i++) {
                    var service = services[i];
                    addService(service, device);
                    var serviceNew = device.services[service.uuid];
                    var characteristics = service.characteristics;

                    for (var j = 0; j < characteristics.length; j++) {
                        var characteristic = characteristics[j];
                        addCharacteristic(characteristic, serviceNew);
                        var characteristicNew = serviceNew.characteristics[characteristic.uuid];
                        var descriptors = characteristic.descriptors;
                        for (var k = 0; k < descriptors.length; k++) {
                            var descriptor = descriptors[k];
                            addDescriptor(descriptor, characteristicNew);
                        }
                    }
                }
            },
            function (obj) {
                Log.add("Discover Error : " + JSON.stringify(obj));
            });
        };

        $rootScope.hasPermission = function() {
            // $log.log("Has Permission");

            $cordovaBluetoothLE.hasPermission().then(function(obj) {
                // $log.log("Has Permission Success : " + JSON.stringify(obj));
            }, function(obj) {
                // $log.log("Has Permission Error : " + JSON.stringify(obj));
            });
        };

        $rootScope.requestPermission = function() {
            // $log.log("Request Permission");

            $cordovaBluetoothLE.requestPermission().then(function(obj) {
                // $log.log("Request Permission Success : " + JSON.stringify(obj));
            }, function(obj) {
                // $log.log("Request Permission Error : " + JSON.stringify(obj));
            });
        };

        $rootScope.isLocationEnabled = function() {
            // $log.log("Is Location Enabled");

            $cordovaBluetoothLE.isLocationEnabled().then(function(obj) {
                // $log.log("Is Location Enabled Success : " + JSON.stringify(obj));
            }, function(obj) {
                // $log.log("Is Location Enabled Error : " + JSON.stringify(obj));
            });
        };

        $rootScope.requestLocation = function() {
            // $log.log("Request Location");

            $cordovaBluetoothLE.requestLocation().then(function(obj) {
                // $log.log("Request Location Success : " + JSON.stringify(obj));
            }, function(obj) {
                // $log.log("Request Location Error : " + JSON.stringify(obj));
            });
        };

        $ionicPlatform.ready(function () {
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
    }])
    .filter('null', function () {
        return function (value) {
            if (value === null || value === undefined) {
                return "<null>";
            }
            return value;
        };
    });
})();