angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {})

.controller('MapCtrl', function($scope, $http, $ionicLoading, $ionicPlatform, dbService) {

    $ionicPlatform.ready(function() {
        
        $ionicLoading.show({
            template : 'Preparing app database, please wait...'
        });

        dbService.init().then(function() {
            
            console.log("dbservice init success");
            
            $ionicLoading.show({
                template : 'Preparing indexes for faster queries, please wait as this may take some time...'
            });
            
            dbService.get_ward_data(14).then(function(ward) {
                console.log(JSON.stringify["ward 14", ward]);
                $ionicLoading.hide();

                $http.get("data/ward_shapes.json").success(function(data) {
                    $scope.geojson = data;                   
                    console.log("Great success in app init");
                });
                
            }, function() {
                console.log("Great failure in dbservice init");    
                $ionicLoading.hide();
            });
            

        }, function() {
            console.log("Great failure in dbservice init");
            $ionicLoading.hide();
        });
    });

}).controller('WardCtrl', function($scope, $http, $stateParams, dbService) {

    var ward_id = parseInt($stateParams.id);
    dbService.get_ward_data(ward_id).then(function(ward) {
        $scope.ward = ward;
        console.log(JSON.stringify(ward));
    });
    
    /*
    dbService.get_ward_by_ward_number(ward_id).then(function(ward) {
        $scope.ward = ward;
        console.log(JSON.stringify(ward));

        dbService.get_candidate_by_ward_number(ward_id).then(function(candidate) {
            $scope.ward.candidate = candidate;
            console.log(JSON.stringify(candidate));

            dbService.get_ward_results_by_ward_number(ward_id).then(function(ward_results) {
                $scope.ward.ward_results = ward_results;
                console.log(JSON.stringify(ward_results));

                dbService.get_borough_by_roman_number($scope.ward.borough_roman_number).then(function(borough) {
                    $scope.ward.borough = borough;
                    console.log(JSON.stringify(borough));
                }, function(error) {
                    console.error("Error in get_borough_by_roman_number");
                });

            }, function(error) {
                console.error("Error in get_ward_results_by_ward_number");
            });
        }, function(error) {
            console.error("Error in get_candidate_by_ward_number");
        });

    }, function(error) {
        console.error("Error in get_ward_by_ward_number");
    });
    */
});
