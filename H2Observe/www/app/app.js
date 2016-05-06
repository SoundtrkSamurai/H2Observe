(function () {
    "use strict";

    angular.module("h2observe", ['ionic', 'myapp.controllers', 'myapp.services', 'ngCordova', 'ui-leaflet'])
        .run(function ($state, $ionicPlatform) {
            $ionicPlatform.ready(function () {
                if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }
                $state.go('app.map');
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
            .state("app.home", {
                url: "/home",
                templateUrl: "app/templates/view-home.html",
                controller: "homeCtrl"
            });
            $urlRouterProvider.otherwise("/app/home");
        });
})();