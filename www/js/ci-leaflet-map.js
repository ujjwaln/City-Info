'use strict';

angular.module("leafletMap", [])

.service("L", ["$window",
function($window) {
    return $window.L;
}])

.service('colorbar', function() {

    var colorbar = [];
    for (var j = 0; j < 256; j++) {
        colorbar[j] = window.net.brehaut.Color([j, 0, 255 - j]);
    }

    var getColor = function(minValue, maxValue, value) {
        if (maxValue > minValue) {
            var i = parseInt(255 * (parseInt(value) - minValue) / (maxValue - minValue));
            i = Math.min(i, 255);
            if (i < 0)
                i = 0;
            return colorbar[i].toString();
        } else {
            return colorbar[0].toString();
        }
    };

    return {
        getColor : getColor
    };
})

.directive("leafletMap", function() {
    
    return {
        
        restrict : 'A',
        
        scope : {
            center : '=',
            zoom : '=',
            geojson : '='
        },

        controller : ["$scope", "L", "colorbar", "$q",

        function($scope, L, Colorbar,  $q) {
            $scope.layers = [];
            $scope.createMap = function(elem) {
                $scope.map = L.map(elem[0], {
                    center : $scope.center,
                    zoom : $scope.zoom,
                    position: 'bottomleft'
                });

                var gglt = new L.Google('HYBRID');
                var gglr = new L.Google('ROADMAP');
                
                $scope.map.addLayer(gglr);
                $scope.map.addLayer(gglt);
                
                $scope.map.addControl(new L.Control.Layers({
                    'Map' : gglr,
                    'Satellite' : gglt
                }));
            };
            
            $scope.$watch("geojson", function(layer) {
                if (!!layer) {
                    if ($scope.current_layer) {
                        $scope.map.removeLayer($scope.current_layer);
                    }

                    $scope.current_layer = L.geoJson(layer, {
                        
                        style : function(feature) {
                            //return {color: Colorbar.getColor(feature.properties.value)};
                            //var color = Colorbar.getColor(minVal, maxVal, feature.properties.value);
                            return {
                                fillColor : "#f00",
                                weight : 1,
                                opacity : 1,
                                color : "#000",
                                fillOpacity : 0.3
                            };
                        },

                        onEachFeature : function(feature, layer) {
                            
                            layer.bindPopup("<a href='#/app/ward/" + String(feature.properties.FID) + "'> Ward " 
                                + String(feature.properties.FID) + "</a>");
                            
                            layer.on({
                                click : function(e) {
                                    if ($scope.selection) {
                                        $scope.selection.setStyle({
                                            fillColor : "#f00",
                                            weight : 1,
                                            opacity : 1,
                                            color : "#000",
                                            fillOpacity : 0.3
                                        });
                                    }
                                    $scope.selection = this;
                                    this.setStyle({
                                        weight : 5,
                                        color : '#666',
                                        dashArray : '',
                                        fillOpacity : 0.6
                                    });
                                }
                            });
                        }
                    });

                    $scope.current_layer.addTo($scope.map);
                }
            });
        }],

        link : function(scope, elem, attrs) {
            scope.createMap(elem);
        }
    };
});
