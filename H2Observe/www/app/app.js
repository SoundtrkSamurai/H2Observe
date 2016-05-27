﻿(function () {
    "use strict";

    angular.module("h2observe", ['ionic', 'myapp.controllers', 'myapp.services', 'ngCordova', 'ui-leaflet', 'ngCordovaBluetoothLE'])
        .run(function ($state, $ionicPlatform) {
            $ionicPlatform.ready(function () {
                if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }
            });
        })
        .config(function ($stateProvider, $urlRouterProvider) {
            $stateProvider
            .state("app", {
                url: "/app",
                abstract: true,
                templateUrl: "app/templates/view-menu.html",
                controller: "appController as app"
            })
            .state('app.map', {
                url: '/map',
                templateUrl: 'app/templates/view-map.html',
                controller: 'mapController as mapCtrl'
            })
            .state('app.ble', {
                url: '/bluetooth',
                templateUrl: 'app/templates/view-ble.html',
                controller: 'bluetoothController as bleCtrl'
            })
            .state('app.bledevice', {
                url: '/bluetooth/device/:deviceId',
                templateUrl: 'app/templates/view-bledevice.html',
                controller: 'bluetoothDevice as bleDeviceCtrl'
            })
            .state('app.bleservice', {
                url: '/bluetooth/device/:deviceId/service/:serviceId',
                templateUrl: 'app/templates/view-bleservice.html',
                controller: 'bluetoothService as bleSvcCtrl'
            })
            .state("app.home", {
                url: "/home",
                templateUrl: "app/templates/view-home.html",
                controller: "homeCtrl"
            });
            $urlRouterProvider.otherwise("/app/map");
        });
})();