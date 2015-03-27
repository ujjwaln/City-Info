angular.module("starter.services", []).service("dbService", ["$window", "$q", "$http", "$log",
function($window, $q, $http, $log) {

    var dbname = "city_info_db";
    var service_url = "http://127.0.0.1:5001/";
    var cb_url = null, coax = null, db = null;

    var user = {
        "user_id" : "org.couchdb.user:wallyfoo",
        "access_token" : "asdasdasdasdsfsdfsdfsdfsdfdSA"
    };

    var logMessage = function(msg) {
        alert(msg);
    };

    function isObject(obj) {
        if (angular.equals({}, obj))
            return false;
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return true;
        }
        return false;
    }

    var get_cb_url = function() {
        var def = $q.defer();
        if ($window.cordova) {
            if ($window.cblite) {
                $window.cblite.getURL(function(err, url) {
                    console.log(JSON.stringify(err, url));

                    //if (!/Apple/.test(navigator.userAgent)) {
                    // this helps on Android < 4.4
                    // otherwise basic auth doesn't work
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.open('GET', url, false);
                    xmlHttp.send(null);
                    console.log('XMLHttpRequest get: ' + xmlHttp.responseText);
                    //}
                    /*
                     var res=url.match(/http:\/\/(.+)/);
                     var parts=res[1].split(':');
                     var username=parts[0];
                     var tt=parts[1].split('@');
                     var pass = tt[0];

                     user.name = username;
                     user.password = pass;
                     console.log(JSON.stringify(user));
                     */

                    if (err) {
                        logMessage("error launching Couchbase Lite: ");
                        def.reject(null);
                    } else {
                        //logMessage("Couchbase Lite running at " + url);
                        def.resolve(url);
                    }
                });
            } else {
                logMessage("error, Couchbase Lite plugin not found.");
            }
        } else {
            def.resolve("http://127.0.0.1:5984/");
        }
        return def.promise;
    };

    function init() {
        var def = $q.defer();
        coax = require("coax");
        get_cb_url().then(function(url) {
            cb_url = url;
            db = coax([cb_url, dbname]);
            db.get(function(err, res, body) {
                if (isObject(err) || (res.status === 404)) {
                    db.put(function(err, res, body) {
                        if (isObject(err)) {
                            console.log(JSON.stringify(["create db PUT error", err, res, body]));
                            def.reject();

                        } else {
                            console.log(JSON.stringify(["created new db", res]));
                            insert_user().then(function() {
                                insert_data().then(function() {
                                    console.log("Inserted Data");
                                    create_views().then(function() {
                                        console.log("Created Views");

                                        def.resolve();
                                    });
                                });
                            });
                        }
                    });
                } else {
                    console.log("db exists");
                    console.log(JSON.stringify([err, res]));
                    def.resolve();
                }
            });
        });

        return def.promise;
    }

    function insert_user() {
        var def = $q.defer();
        var user_db = db(["_local", "user"]);
        user_db.put(user, function(err, res, body) {
            console.log(JSON.stringify(["Created user", res]));
            user.rev = res.rev;
            def.resolve();
        });

        return def.promise;
    }

    function insert_data() {
        var entities = ['ward', 'wardresult', 'candidate', 'borough'];
        //var db = coax([cb_url, dbname, "_bulk_docs"]);
        var promises = [];
        var main_def = $q.defer();

        var bulk_db = db(["_bulk_docs"]);
        angular.forEach(entities, function(entity, index) {
            var def = $q.defer();
            $http.get("data/" + entity + ".json").success(function(data, status, headers, config) {
                var entity_type = entity;
                var docs = [];
                for (var i = 0; i < data.length; i++) {
                    var doc = data[i];
                    doc["type"] = entity_type;
                    if (user && user.user_id) {
                        doc["owner"] = "p:" + user.user_id;
                    }
                    docs.push(doc);
                }

                bulk_db.post({
                    "docs" : docs
                }, function(err, ok) {
                    if (isObject(err))
                        console.log(JSON.stringify(err));
                });
                def.resolve();

            }).error(function(data, status, headers, config) {
                console.error("error while fetching entities", data);
                def.reject();
            });

            promises.push(def.promise);
        });

        $q.all(promises).then(function() {
            main_def.resolve();
        });

        return main_def.promise;
    }

    function create_views() {

        var ward_view = {
            "_id" : "_design/wards",
            "language" : "javascript",
            "views" : {
                "all" : {
                    "map" : "function(doc) { if (doc.type == 'ward') {emit(null, doc);} }"
                },
                "by_ward_number" : {
                    "map" : "function(doc) { if (doc.type == 'ward') {emit(doc.ward_number, doc);} }"
                }
            }
        };

        var wardresult_view = {
            "_id" : "_design/wardresults",
            "language" : "javascript",
            "views" : {
                "all" : {
                    "map" : "function(doc) { if (doc.type == 'wardresult') {emit(null, doc);} }"
                },
                "by_ward_number" : {
                    "map" : "function(doc) { if (doc.type == 'wardresult') {emit(doc.ward_number, doc);} }"
                }
            }
        };

        var candidate_view = {
            "_id" : "_design/candidates",
            "language" : "javascript",
            "views" : {
                "all" : {
                    "map" : "function(doc) { if (doc.type == 'candidate') {emit(null, doc);} }"
                },
                "by_ward_number" : {
                    "map" : "function(doc) { if (doc.type == 'candidate') {emit(doc.ward_number, doc);} }"
                }
            }
        };

        var borough_view = {
            "_id" : "_design/boroughs",
            "language" : "javascript",
            "views" : {
                "all" : {
                    "map" : "function(doc) { if (doc.type == 'borough') {emit(null, doc);} }"
                },
                "by_borough_roman_number" : {
                    "map" : "function(doc) { if (doc.type == 'borough') {emit(doc.borough_roman_no, doc);} }"
                }
            }
        };

        var view_docs = [ward_view, wardresult_view, candidate_view, borough_view];
        //var db = coax([cb_url, dbname]);

        var promises = [];
        var main_def = $q.defer();

        angular.forEach(view_docs, function(view_doc, index) {
            var def = $q.defer();
            db.post(view_doc, function(err, ok) {
                def.resolve();
            });
            promises.push(def.promise);
        });

        $q.all(promises).then(function() {
            main_def.resolve();
        });

        return main_def.promise;
    }

    function get_all_wards() {
        var def = $q.defer();
        $http.get(cb_url + dbname + "/_design/wards/_view/all").success(function(data, status, headers, config) {
            def.resolve(data);
        }).error(function(data, status, headers, config) {
            def.reject();
        });
        return def.promise;
    }

    function get_ward_data(ward_number) {
        var def = $q.defer();
        var ward_data = {};
        get_ward_by_ward_number(ward_number).then(function(ward) {
            ward_data.ward = ward;
            get_candidate_by_ward_number(ward_number).then(function(candidate) {
                ward_data.candidate = candidate;
                get_ward_results_by_ward_number(ward_number).then(function(ward_results) {
                    ward_data.ward_results = ward_results;
                    get_borough_by_roman_number(ward_data.ward.borough_roman_number).then(function(borough) {
                        ward_data.borough = borough;
                        def.resolve(ward_data);
                    }, function(err) {
                        console.error(err);
                        def.reject(ward_data);
                    });
                }, function(err) {
                    console.error(err);
                    def.reject(ward_data);
                });
            }, function(err) {
                console.error(err);
                def.reject(ward_data);
            });
        }, function(err) {
            console.error(err);
            def.reject(ward_data);
        });
        
        return def.promise;
    }

    function get_ward_by_ward_number(ward_number) {
        var def = $q.defer();
        var wards = db(["_design", "wards"]);
        //wards.get(["_view", "by_ward_number", {"startkey": ward_number, "endkey": ward_number}],
        wards.get(["_view", "by_ward_number", {
            "key" : ward_number
        }], function(err, res, body) {
            if (err || isObject(err)) {
                console.log(JSON.stringify(err));
                def.reject(err);
            }

            if (res.rows && res.rows.length && res.rows[0]["value"]) {
                def.resolve(res.rows[0]["value"]);
            } else {
                def.reject(res);
            }

        });

        return def.promise;
    }

    function get_borough_by_roman_number(roman_number) {
        var def = $q.defer();
        var boroughs = db(["_design", "boroughs"]);
        //boroughs.get(["_view", "by_borough_roman_number", {"startkey": roman_number, "endkey": roman_number}],
        boroughs.get(["_view", "by_borough_roman_number", {
            "key" : roman_number
        }], function(err, res, body) {
            if (err || isObject(err)) {
                console.log(JSON.stringify(err));
                def.reject(err);
            }

            if (res.rows && res.rows.length && res.rows[0]["value"]) {
                def.resolve(res.rows[0]["value"]);
            } else {
                def.reject(res);
            }
        });

        return def.promise;
    }

    function get_ward_results_by_ward_number(ward_number) {
        var def = $q.defer();
        var wardresults = db(["_design", "wardresults"]);
        //wardresults.get(["_view", "by_ward_number", {"startkey": ward_number, "endkey": ward_number}],
        wardresults.get(["_view", "by_ward_number", {
            "key" : ward_number
        }], function(err, res, body) {
            if (err || isObject(err)) {
                console.log(JSON.stringify(err));
                def.reject(err);
            }

            if (res.rows && res.rows.length && res.rows[0]["value"]) {
                def.resolve(res.rows[0]["value"]);
            } else {
                def.reject(res);
            }
        });

        return def.promise;
    }

    function get_candidate_by_ward_number(ward_number) {
        var def = $q.defer();
        //var db = coax([cb_url, dbname]);
        var candidates = db(["_design", "candidates"]);
        //candidates.get(["_view", "by_ward_number", {"startkey": ward_number, "endkey": ward_number}],
        candidates.get(["_view", "by_ward_number", {
            "key" : ward_number
        }], function(err, res, body) {
            if (err || isObject(err)) {
                console.log(JSON.stringify(err));
                def.reject(err);
            }

            if (res.rows && res.rows.length && res.rows[0]["value"]) {
                def.resolve(res.rows[0]["value"]);
            } else {
                def.reject(res);
            }
        });

        return def.promise;
    }

    function get_entity(entity, id) {
        var def = $q.defer();
        //http://127.0.0.1:5984/cityinfodb/_design/wards/_view/by_ward_number
        //http://127.0.0.1:5984/cityinfodb/_design/wards/_view/by_ward_number?startkey=1&endkey=1

        return def.promise;
    };

    return {
        init : init,
        get_ward_data: get_ward_data
        /*
        get_entity : get_entity,
        get_all_wards : get_all_wards,
        get_ward_by_ward_number : get_ward_by_ward_number,
        get_candidate_by_ward_number : get_candidate_by_ward_number,
        get_ward_results_by_ward_number : get_ward_results_by_ward_number,
        get_borough_by_roman_number : get_borough_by_roman_number
        */
    };
}]);
