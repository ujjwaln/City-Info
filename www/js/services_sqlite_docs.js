angular.module("starter.services", []).service("dbService", ["$window", "$q", "$http", "$log",
function($window, $q, $http, $log) {

    var dbname = "city_info_db";
    var service_url = "http://127.0.0.1:5001/";
    var db = null;

    function get_entity(entity, id) {
        var def=$q.defer();
        if (!db) init();
        
        db.transaction(function(tx) {
           var sql = "SELECT doc from " + entity + " where id=?";
           tx.executeSql(sql, [id], function(tx, res) {
                var len = res.rows.length;
                if(len>0)
                {
                    var doc = res.rows.item(0)["doc"];
                    var obj = angular.fromJson(doc);
                    console.log(obj);
                    def.resolve(obj);
                }
           });
        });
        
        return def.promise;
    };
    
    function init() {
        if ($window.cordova) {
            db = $window.sqlitePlugin.openDatabase({
                name : dbname
            });
        } else {
            db = $window.openDatabase(dbname, "1.0", dbname, 1024 * 1024 * 10);
        }
        
        var promises = [];
        var entities = ['ward', 'wardresult', 'candidate', 'borough'];
        for (var i=0; i<entities.length; i++) {
            promises.push(_local_save(entities[i]));
        }
        
        $q.all(promises).then(function() {
           console.log("created tables"); 
        });
    }

    function _create_table(table_name) {
        var def = $q.defer();
        db.transaction(function(tx) {
            var sql = "DROP TABLE IF EXISTS " + table_name;
            tx.executeSql(sql, [], function(tx, res) {
                db.transaction(function(tx1) {
                    var sql = "CREATE TABLE " + table_name + " (id integer primary key autoincrement, doc varchar(1024) NOT NULL);";
                    tx1.executeSql(sql, [], function(tx, res) {
                       def.resolve(); 
                    });
                });
            });
        });
        
        return def.promise;
    }
    
    function _local_save(entity_name) {
        var def = $q.defer(); 
        var table_name = entity_name; 
        
        _create_table(table_name).then(function() {
            $http.get(service_url + entity_name).success(function(data, status, headers, config) {
                db.transaction(function(tx) {
                    for (var i=0; i<data.length; i++) {
                        var doc = angular.toJson(data[i]);
                        var sql = "INSERT INTO " + table_name + " ('doc') VALUES (?);";
                        tx.executeSql(sql, [doc]); 
                    }
                    def.resolve();
                });
            });
        });
        
        return def.promise;
    }

    return {
        init: init,
        get_entity: get_entity
    };
    
}]);
