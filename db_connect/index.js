'use strict';

var config = require(__dirname + '/../config.js'),
    _ = require('underscore'),
    async = require('async'),
    dbConfig = (process.env.NODE_ENV === "production") ?  config.urlshortner_prod :  config.urlshortner,
    r = require('rethinkdbdash')(dbConfig);

module.exports = function (callback) {
    var table = 'url_map';
    /*
     * Connect to rethinkdb, create the needed tables/indexes and then start express.
     * Create tables/indexes then start express
     */
    async.waterfall([
        function createDatabase(callback) {
            //Create the database if needed.
            r.dbList().contains(dbConfig.db).do(function (containsDb) {
                return r.branch(
                    containsDb,
                    {created: 0},
                    r.dbCreate(dbConfig.db)
                );
            }).run().then(function (err) {
                _.has(err,'created') ? callback(null) : callback(err);
            });
        },
        function createTable(callback) {
            //Create the table if needed.
            r.tableList().contains(table).do(function (containsTable) {
                return r.branch(
                    containsTable,
                    {created: 0},
                    r.tableCreate(table)
                );
            }).run( function (err) {
                callback(err);
            });
        }
    ], function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null);
    });
};