'use strict';
var aerospike = require('aerospike');
var asConfig = require('../aerospikeConfig');
var utility = require('./utility')
var aerospikeConfig = asConfig.aerospikeConfig();
var aerospikeDBParams = asConfig.aerospikeDBParams();
var async = require('async');
var client;
var _ = require('underscore');

_.mixin(require('../mixins'));


// Establish connection to the cluster
exports.connect = function(callback) {
    aerospike.connect(aerospikeConfig,function(err,clt) {
        client = clt;
        return callback(err ? err : 0);
    });
};


var batchRead = function (options, callback) {
    var dbNamespace = aerospikeDBParams.defaultNamespace;
    var key1 = aerospike.key(dbNamespace, aerospikeDBParams.defaultSet, options.name1);
    var key2= aerospike.key(dbNamespace, aerospikeDBParams.defaultSet, options.name2);
    // Specify the batch of keys of the records to be read.
    var readKeys = [
        {key: key1,read_all_bins: true},
        {key: key2,read_all_bins: true}
    ];
    client.batchRead(readKeys, function(err, rec, meta) {
        // Check for errors
        if(err || !rec) {
            // An error occurred
            callback({status:-1,message:'Record not found!'});
            return;
        }
        console.log("\n\n resp-->",JSON.stringify(rec));
        callback(err,rec,meta);
        return;
    });
}

var update = function (name, options, cb) {
    var dbNamespace = aerospikeDBParams.defaultNamespace;
    var key = aerospike.key(dbNamespace, aerospikeDBParams.defaultSet, name);
    console.log(" going to dele-->",key,name)
    // Delete the record using the key k
    client.remove(key, function (error, keyRes) {

        if (error && (error.message !== "AEROSPIKE_ERR_RECORD_NOT_FOUND")) {
            console.log("error-%s", error.message,typeof error.message)
            return cb(error);
        }
        client.put(key, options, {}, function (err, response) {
            console.log("\n\n updated one-->",err,response,cb)
            cb && cb(err,response)
        });
    })
}

exports.write = function (options, callback) {
    var dbNamespace = aerospikeDBParams.defaultNamespace;
    var primaryUser = options.user;
    var secUser = options.to || options.from;
    var key1 = aerospike.key(dbNamespace, aerospikeDBParams.defaultSet, primaryUser);
    var key2 = aerospike.key(dbNamespace, aerospikeDBParams.defaultSet, secUser);
    var meta = options.ttl ? {ttl:+options.ttl} :{};
    var user, toUser;
    batchRead({ name1:primaryUser, name2:secUser },function (err, rec) {
        if(err){
            return callback(err);
        }
        user = _.at(rec,'0.bins');
        toUser = _.at(rec,'1.bins');
        var updatedRec = utility.updateRec({
            user:user,
            toUser:toUser,
            data: options
        });
        update(primaryUser, updatedRec.user, function (err, resp) {
            console.log("\n\n updating frinst over -->",err,resp)
            if(err){
               console.error("Error updating the user data");
               return callback("Error updating the user data: "+ err);
            }
            update(secUser, updatedRec.toUser, function(err,udpateRes){
                console.log(" done updateing-->",err,updatedRec);
                callback(err,updatedRec)
            });
            return;
        })
    })
}

exports.addNew = function (body, callback) {
    var dbNamespace = aerospikeDBParams.defaultNamespace;
    var key = aerospike.key(dbNamespace, aerospikeDBParams.defaultSet, body.name);
    var data = {
        summary : {
            debits: 0,
            credits: 0
        },
        history: [],
        curr_debits : {},
        curr_credits: {}
    }
    client.put(key,data,{},callback);
}

// called when application shuts down
exports.shutdown =  function  () {
    client.close();
    client && client.close();
    aerospike.releaseEventLoop();
};




// Read a record
exports.batchRead = function(options, callback) {
    return batchRead({name1: options.name1, name2:options.name2},callback);
};

exports.Read = function (options, callback) {
    var dbNamespace = aerospikeDBParams.defaultNamespace;
    var key = aerospike.key(dbNamespace, aerospikeDBParams.defaultSet, options.name);
    client.get(key, function(err, rec, meta) {
        // Check for errors
        if(err || !rec) {
            // An error occurred
            callback({status:-1,message:'Record not found!'});
            return;
        }
        console.log("\n\n resp-->",JSON.stringify(rec));
        callback(err,rec,meta);
        return;
    });
}
//Read a secondary indexed record
exports.readSecIndexRecord = function(options, callback){
    var err, records;
    var dbNamespace = (options.db === 'us_cache') ? aerospikeDBParams.cacheNamespace : aerospikeDBParams.defaultNamespace;
    var query = client.query(dbNamespace, aerospikeDBParams.defaultSet);
    query.where(aerospike.filter.equal(options.secIndex, options.k));
    var stream = query.execute()
    stream.on('error', function(error, rec) {
        err = error;
    });
    stream.on('data',function(record,cd,sa){
        console.log("\n\n secIndex recodrd-->",record);
        records = record;
    });
    stream.on('end',function(err,re){
        callback(err,records);
        //Write to the cache db if doc was not found in cache db
        if(!options.db && records){
            writeRecord({
                k: options.k,
                db: 'us_cache',
                bins: {
                    url: records.url
                }
            },function(){});
        }
    });

    return;
};


//Read a secondary indexed record
exports.readDatTimeRecord = function(options, callback){
    var err, records = [];
    var query = client.query(aerospikeDBParams.defaultNamespace, aerospikeDBParams.defaultSet);
    query.where(aerospike.filter.range(options.secIndex || 'datetime', Number(options.datetime), options.end || 9999999999));
    var stream = query.execute()
    stream.on('error', function(error, rec) {
        err = error;
    });
    stream.on('data',function(record,cd,sa){
        records.push(record);
    });
    stream.on('end',function(err,re){
        callback(err,records);
    });

    return;
};