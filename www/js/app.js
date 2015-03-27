// Ionic Starter App
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'leafletMap']).run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
        console.log("Ionic platform ready");
    });
}).config(function($stateProvider, $urlRouterProvider, $httpProvider) {

    $httpProvider.defaults.useXDomain = true;

    $stateProvider.state('app', {
        url : "/app",
        abstract : true,
        templateUrl : "templates/menu.html",
        controller : 'AppCtrl'

    }).state('app.map', {
        url : "/map",
        views : {
            'menuContent' : {
                templateUrl : "templates/map.html",
                controller : 'MapCtrl'
            }
        }
    }).state('app.ward', {
        url : "/ward/:id",
        views : {
            'menuContent' : {
                templateUrl : "templates/ward.html",
                controller : 'WardCtrl'
            }
        }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/map');
});
