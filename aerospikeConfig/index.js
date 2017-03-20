'use strict';
var Aerospike = require('aerospike');
var hosts = 'localhost:3000';
exports.aerospikeConfig = function()    {
    return  {
        hosts: hosts,
        policies: {
            exists: Aerospike.policy.exists.CREATE,
            key: Aerospike.policy.key.SEND,
            timeout: 2000
        }
    };
};
exports.aerospikeDBParams = function()  {
    return {
        defaultNamespace: 'irc',
        defaultSet: 'transactions'
    };
};
