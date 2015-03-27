angular.module("starter.services", [])
    .service("dbService1", ["$window", "$q", "$http", "$log", function($window, $q, $http, $log) {
        
        var dbname = "cityinfo.db";
        
        var sqlFilename = "kolkata_police.sql";
        
        function init() {
            var db = null;
            if (window.cordova) {
                db = window.sqlitePlugin.openDatabase({name: dbname});
            } 
            else {
                db = window.openDatabase(dbname, "1.0", dbname, 1024 * 1024 * 10); //10 MB database
            }
            
            _createTables().then(function() {
               _insertData(); 
            });
        };
        
        function _createTables() {
            var def = $q.defer();
            //create tables  
            _readFile(sqlFilename).then(function(s) {
                db.transaction(function(tx) {
                    var rows = s.split(";");
                    for (var i=0; i<rows.length; i++) {
                        if (rows[i].length > 1) {
                            var sql = rows[i].trim();
                            tx.executeSql(sql, [], function(tx, res) {});    
                        }
                    }
                    def.resolve();
                });
            },
            function(er) {
                console.error(er);
                def.reject();                
            });
            
            return def.promise;
        };
        
        function _insertData() {
            
            var tables = [
                {"name": "boroughs", "file": "boroughs.csv"},
                {"name": "election_2010_candidates", "file": "election_2010_candidates.csv"},
                {"name": "election_2010_ward_results", "file": "election_2010_ward_results.csv"},
                {"name": "wards", "file": "wards     .csv"}
            ];
            
            for (var i=0; i<tables.length; i++) {
                _readFile("db/" + tables[i].file).then(function(s) {
                    var rows = s.split("\n");
                    var insert_sql = "insert into "
                    for (var i=1; i<rows.length; i++) {
                        
                    }
                });
            }
            
            _readFile(sqlFilename).then(function(s) {
                db.transaction(function(tx) {
                    var rows = s.split(";");
                    for (var i=0; i<rows.length; i++) {
                        if (rows[i].length > 1) {
                            var sql = rows[i].trim();
                            tx.executeSql(sql, [], function(tx, res) {});    
                        }
                    }
                });
            },
            function(er) {
                console.error(er);                
            });
        };
        
        function _readFile(fname) {
            var def = $q.defer();
            
            function onFileSuccess(fileEntry) {
                fileEntry.file(function(file) {
                   var reader = new FileReader();
                   reader.onloadend = function(e) {
                       def.resolve(this.result);
                   };
                   reader.readAsText(file);
                });
            };
            
            function onFileFail(e) {
                $log.error("FileSystem Error");
                def.reject(e);
            };
            
            if (window.cordova) {
                //This alias is a read-only pointer to the app itself
                $window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + "www/" + fname, onFileSuccess, onFileFail);
            } else {
                $http.get(fname).success(function(data, status, headers, config) {
                    def.resolve(data);
                }).error(function(data, status, headers, config) {
                    def.reject(data);
                });
            }
            
            return def.promise;
        };
        
        return {
            init: init
        };
        
    }]);
