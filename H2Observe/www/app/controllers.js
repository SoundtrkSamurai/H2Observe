(function () {
    "use strict";

    angular.module("myapp.controllers", [])

    .controller("appController", [function () {
        var controller = this;
        controller.companyName = 'H2Observe';
        controller.bleDeviceId = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
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
                // map.removeControl(map.zoomControl);
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
        $rootScope.devices = {};

        function startScan() {
            if (window.cordova.platformId === 'windows') {
                $rootScope.retrieveConnected();
            } else {
                $rootScope.startScan();
            }
        }

        function addDevice(device) {
            if ($rootScope.devices[device.address] !== undefined) {
                return false;
            } else {
                device.services = {};
                $rootScope.devices[device.address] = device;
            }
        }

        function stopScan() {
            $rootScope.stopScan();
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
            $state.go("app.bledevice", { devideId: device.address });
        };

        $rootScope.isEmpty = function () {
            if (Object.keys($rootScope.devices).length === 0) {
                return true;
            }
            return false;
        };

        $rootScope.initialize = function () {
            var params = {
                request: true,
                restoreKey: "h2observe-app"
            };

            // $log.log("Initialize : " + JSON.stringify(params));

            $cordovaBluetoothLE.initialize(params).then(null,
                function (reason) {
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
                services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']
            };

            // $log.log("Retrieve Connected : " + JSON.stringify(params));
            $cordovaBluetoothLE.retrieveConnected(params)
            .then(
                function (pairedDevices) {
                    _.each(pairedDevices, function (device) {
                        // $log.log("Retrieve Connected Success : " + JSON.stringify(obj));
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

    .controller('bluetoothDevice', function($scope, $rootScope, $state, $stateParams, $ionicHistory, $cordovaBluetoothLE, $interval, $log) {
    
        var controller = this;

        function addDescriptor(descriptor, characteristic) {
            if (characteristic.descriptors[descriptor.uuid] !== undefined) {
                return;
            }
            characteristic.descriptors[descriptor.uuid] = { uuid: descriptor.uuid };
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

        function getDeviceServices(address) {

            // log("Getting device services...", "status");
            var platform = window.cordova.platformId;
            if (platform === "android") {
                $rootScope.discover(address);
            }
            else {
                $rootScope.services(address);
            }
        }

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

        $scope.$on("$ionicView.beforeEnter", function () {
            $rootScope.selectedDevice = $rootScope.devices[$stateParams.deviceId];
        });

        $scope.$on("$ionicView.enter", function () {
            if ($rootScope.selectedDevice) {
                controller.connect($rootScope.selectedDevice.address);
            }
        });

        $scope.goToService = function (service) {
        $state.go("tab.service", {address:$rootScope.selectedDevice.address, service: service.uuid});
        };

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

        $rootScope.reconnect = function(address) {
        var params = {address:address, timeout: 10000};

        // Log.add("Reconnect : " + JSON.stringify(params));

        $cordovaBluetoothLE.reconnect(params).then(null, function(obj) {
            // Log.add("Reconnect Error : " + JSON.stringify(obj));
            $rootScope.close(address); //Best practice is to close on connection error
        }, function(obj) {
            // Log.add("Reconnect Success : " + JSON.stringify(obj));
        });
        };

        $rootScope.disconnect = function(address) {
        var params = {address:address};

        // Log.add("Disconnect : " + JSON.stringify(params));

        $cordovaBluetoothLE.disconnect(params).then(function(obj) {
            // Log.add("Disconnect Success : " + JSON.stringify(obj));
        }, function(obj) {
            // Log.add("Disconnect Error : " + JSON.stringify(obj));
        });
        };
      
        $rootScope.close = function(address) {
        var params = {address:address};

        // Log.add("Close : " + JSON.stringify(params));

        $cordovaBluetoothLE.close(params).then(function(obj) {
            // Log.add("Close Success : " + JSON.stringify(obj));
        }, function(obj) {
            // Log.add("Close Error : " + JSON.stringify(obj));
        });

        var device = $rootScope.devices[address];
        if (device.services) {
            device.services = {};
        }
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
                        addService({ uuid: service }, device);

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

        $rootScope.descriptors = function (address, service, characteristic) {
            var params = {
                address: address,
                service: service,
                characteristic: characteristic,
                timeout: 5000
            };

            $cordovaBluetoothLE.descriptors(params)
            .then(
                function (result) {
                    if (result.status === 'descriptors') {
                        var device = $rootScope.devices[result.address];
                        var service = device.services[result.service];
                        var characteristic = service.characteristics[result.characteristic];

                        _.each(result.descriptors, function (descriptor) {
                            addDescriptor({ uuid: descriptor }, characteristic);
                        });
                    }
                },
                function (reason) {
                }
            );
        };

        $rootScope.services = function(address) {
        var params = {
            address:address,
            services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'],
            timeout: 5000
        };

        $cordovaBluetoothLE.services(params).then(function(obj) {

            var device = $rootScope.devices[obj.address];
            var services = obj.services;

            _.each(services, function (service) {
                addService({ uuid: service }, device);
                $rootScope.characteristics(obj.address, service);
            });
        }, function(obj) {
            // Log.add("Services Error : " + JSON.stringify(obj));
        });
        };

        $rootScope.characteristics = function (address, service) {
            var params = {
                address: address,
                service: service,
                characteristics: ['6e400002-b5a3-f393-e0a9-e50e24dcca9e', '6e400003-b5a3-f393-e0a9-e50e24dcca9e'],
                timeout: 5000
            };

            $cordovaBluetoothLE.characteristics(params)
            .then(
                function (result) {
                    if (result.status === 'characteristics') {

                        var device = $rootScope.devices[result.address];
                        var service = device.services[result.service];

                        _.each(result.characteristics, function (characteristic) {
                            addCharacteristic({ uuid: characteristic }, service);
                            $rootScope.descriptors(result.address, service, characteristic);
                        });
                    }
                },
                function (reason) {
                }
            );
        };

        $rootScope.descriptors = function(address, service, characteristic) {
        var params = {
            address: address,
            service: service,
            characteristic: characteristic,
            timeout: 5000
        };

        // Log.add("Descriptors : " + JSON.stringify(params));

        $cordovaBluetoothLE.descriptors(params).then(function(obj) {
            // Log.add("Descriptors Success : " + JSON.stringify(obj));

            var device = $rootScope.devices[obj.address];
            var service = device.services[obj.service];
            var characteristic = service.characteristics[obj.characteristic];

            var descriptors = obj.descriptors;

            for (var i = 0; i < descriptors.length; i++) {
            addDescriptor({uuid: descriptors[i]}, characteristic);
            }
        }, function(obj) {
            // Log.add("Descriptors Error : " + JSON.stringify(obj));
        });
        };

        $rootScope.read = function(address, service, characteristic) {
        //Set this to something higher to verify queueing on read/write
        var count = 1;

        $interval(function() {
            var params = {address:address, service:service, characteristic:characteristic, timeout: 5000};

            //Uncomment if you'd like to force some errors
            /*var random = Math.random();
            if (random < .50) {
            params.address = "AA:AA:AA:AA:AA:AA";
            }*/

            // Log.add("Read : " + JSON.stringify(params));

            $cordovaBluetoothLE.read(params).then(function(obj) {
            params.address = address;
            // Log.add("Read Success : " + JSON.stringify(obj));

            if (!obj.value) {
                return;
            }

            var bytes = $cordovaBluetoothLE.encodedStringToBytes(obj.value);
            // Log.add("ASCII (" + bytes.length + "): " + $cordovaBluetoothLE.bytesToString(bytes));
            // Log.add("HEX (" + bytes.length + "): " + $cordovaBluetoothLE.bytesToHex(bytes));
            }, function(obj) {
            // Log.add("Read Error : " + JSON.stringify(obj));
            });
        }, 1, count);

        };

       

        $rootScope.write = function(address, service, characteristic) {
        //Set this to something higher to verify queueing on read/write
        var count = 1;

        $interval(function() {
            var params = {
            address: address,
            service: service,
            characteristic: characteristic,
            value: $cordovaBluetoothLE.bytesToEncodedString($cordovaBluetoothLE.stringToBytes("Hello World")),
            timeout: 5000
            };

            //Uncomment if you'd like to force some errors
            /*var random = Math.random();
            if (random < .50) {
            params.address = "AA:AA:AA:AA:AA:AA";
            }*/

            // Log.add("Write : " + JSON.stringify(params));
            $cordovaBluetoothLE.write(params).then(function(obj) {
            // Log.add("Write Success : " + JSON.stringify(obj));
            }, function(obj) {
            // Log.add("Write Error : " + JSON.stringify(obj));
            });
        }, 1, count);
        };

        $rootScope.writeQ = function(address, service, characteristic) {
        var params = {
            address: address,
            service: service,
            characteristic: characteristic,
            value: $cordovaBluetoothLE.bytesToEncodedString($cordovaBluetoothLE.stringToBytes("Hello World Hello World Hello World Hello World Hello World")),
            type: "noResponse",
            timeout: 5000
        };

        // Log.add("WriteQ : " + JSON.stringify(params));

        $cordovaBluetoothLE.writeQ(params).then(function(obj) {
            // Log.add("WriteQ Success : " + JSON.stringify(obj));
        }, function(obj) {
            // Log.add("WriteQ Error : " + JSON.stringify(obj));
        });
        };

        $rootScope.readDescriptor = function(address, service, characteristic, descriptor) {
        var params = {address:address, service:service, characteristic:characteristic, descriptor:descriptor, timeout: 5000};

        // Log.add("Read Descriptor : " + JSON.stringify(params));

        $cordovaBluetoothLE.readDescriptor(params).then(function(obj) {
            // Log.add("Read Descriptor Success : " + JSON.stringify(obj));

            if (obj.value && (!obj.type || obj.type == "data")) {
            var bytes = $cordovaBluetoothLE.encodedStringToBytes(obj.value);
            // Log.add("ASCII (" + bytes.length + "): " + $cordovaBluetoothLE.bytesToString(bytes));
            // Log.add("HEX (" + bytes.length + "): " + $cordovaBluetoothLE.bytesToHex(bytes));
            }
        }, function(obj) {
            // Log.add("Read Descriptor Error : " + JSON.stringify(obj));
        });
        };

        $rootScope.writeDescriptor = function(address, service, characteristic, descriptor) {
        var params = {
            address: address,
            service: service,
            characteristic: characteristic,
            descriptor: descriptor,
            timeout: 5000
        };

        if (ionic.Platform.isIOS()) {
            params.type = "number";
            params.value = 0;
        } else {
            params.value = $cordovaBluetoothLE.bytesToEncodedString($cordovaBluetoothLE.stringToBytes("123"));
        }

        // Log.add("Write Descriptor : " + JSON.stringify(params));

        $cordovaBluetoothLE.writeDescriptor(params).then(function(obj) {
            // Log.add("Write Descriptor Success : " + JSON.stringify(obj));
        }, function(obj) {
            // Log.add("Write Descriptor Error : " + JSON.stringify(obj));
        });
        };

        $rootScope.wasConnected = function(address) {
        var params = {address:address};

        // Log.add("Was Connected : " + JSON.stringify(params));

        $cordovaBluetoothLE.wasConnected(params).then(function(obj) {
            // Log.add("Was Connected Success : " + JSON.stringify(obj));
        }, function(obj) {
            // Log.add("Was Connected Error : " + JSON.stringify(obj));
        });
        };

        $rootScope.isConnected = function(address) {
        var params = {address:address};

        // Log.add("Is Connected : " + JSON.stringify(params));

        $cordovaBluetoothLE.isConnected(params).then(function(obj) {
            // Log.add("Is Connected Success : " + JSON.stringify(obj));
        }, function(obj) {
            // Log.add("Is Connected Error : " + JSON.stringify(obj));
        });
        };

        $rootScope.isDiscovered = function(address) {
        var params = {address:address};

        // Log.add("Is Discovered : " + JSON.stringify(params));

        $cordovaBluetoothLE.isDiscovered(params).then(function(obj) {
            // Log.add("Is Discovered Success : " + JSON.stringify(obj));
        }, function(obj) {
            // Log.add("Is Discovered Error : " + JSON.stringify(obj));
        });
        };

        $rootScope.rssi = function(address) {
        var params = {address:address, timeout: 5000};

        // Log.add("RSSI : " + JSON.stringify(params));

        $cordovaBluetoothLE.rssi(params).then(function(obj) {
            // Log.add("RSSI Success : " + JSON.stringify(obj));
        }, function(obj) {
            // Log.add("RSSI Error : " + JSON.stringify(obj));
        });
        };

        $rootScope.mtu = function(address) {
        var params = {address:address, mtu: 10, timeout: 5000};

        // Log.add("MTU : " + JSON.stringify(params));

        $cordovaBluetoothLE.mtu(params).then(function(obj) {
            // Log.add("MTU Success : " + JSON.stringify(obj));
        }, function(obj) {
            // Log.add("MTU Error : " + JSON.stringify(obj));
        });
        };

        $rootScope.requestConnectionPriority = function(address) {
        var params = {address:address, connectionPriority:"high", timeout: 5000};

        // Log.add("Request Connection Priority : " + JSON.stringify(params));

        $cordovaBluetoothLE.requestConnectionPriority(params).then(function(obj) {
          // Log.add("Request Connection Priority Success : " + JSON.stringify(obj));
        }, function(obj) {
          // Log.add("Request Connection Priority Error : " + JSON.stringify(obj));
        });
      };
    })

    .controller('ServiceCtrl', function($scope, $rootScope, $state, $stateParams, $cordovaBluetoothLE, Log) {
        $scope.$on("$ionicView.beforeEnter", function () {
            $rootScope.selectedService = $rootScope.selectedDevice.services[$stateParams.service];
        });

        $rootScope.subscribe = function (address, service, characteristic) {
            var params = {
                address: address,
                service: service,
                characteristic: characteristic,
                timeout: 5000,
                //subscribeTimeout: 5000
            };

            // Log.add("Subscribe : " + JSON.stringify(params));

            $cordovaBluetoothLE.subscribe(params).then(function (obj) {
                // Log.add("Subscribe Auto Unsubscribe : " + JSON.stringify(obj));
            }, function (obj) {
                // Log.add("Subscribe Error : " + JSON.stringify(obj));
            }, function (obj) {
                //// Log.add("Subscribe Success : " + JSON.stringify(obj));

                if (obj.status == "subscribedResult") {
                    //// Log.add("Subscribed Result");
                    var bytes = $cordovaBluetoothLE.encodedStringToBytes(obj.value);
                    // Log.add("Subscribe Success ASCII (" + bytes.length + "): " + $cordovaBluetoothLE.bytesToString(bytes));
                    // Log.add("HEX (" + bytes.length + "): " + $cordovaBluetoothLE.bytesToHex(bytes));
                } else if (obj.status == "subscribed") {
                    // Log.add("Subscribed");
                } else {
                    // Log.add("Unexpected Subscribe Status");
                }
            });
        };

        $rootScope.unsubscribe = function (address, service, characteristic) {
            var params = {
                address: address,
                service: service,
                characteristic: characteristic,
                timeout: 5000
            };

            // Log.add("Unsubscribe : " + JSON.stringify(params));

            $cordovaBluetoothLE.unsubscribe(params).then(function (obj) {
                // Log.add("Unsubscribe Success : " + JSON.stringify(obj));
            }, function (obj) {
                // Log.add("Unsubscribe Error : " + JSON.stringify(obj));
            });
        };

        $scope.goToCharacteristic = function(characteristic) {
            $state.go("tab.characteristic", {address:$rootScope.selectedDevice.address, service: $rootScope.selectedService.uuid, characteristic: characteristic.uuid});
        };
    })
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