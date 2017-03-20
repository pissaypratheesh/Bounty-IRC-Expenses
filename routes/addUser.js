/**
 * Created by m01352 on 20/03/17.
 */
/**
 * Created by m01352 on 20/03/17.
 */
/**
 * Created by pratheesh.pm on 15/09/16.
 */
'use strict';
var _ = require('underscore'),
    aerospikeApi = require('../lib/api'),
    uuidV1 = require('uuid/v1');

_.mixin(require('../mixins'));


exports.addUser = function (req, res, next) {
    var body = req.body;
    if(!body.name){
        return res.status(500).json({"Error":"Incorrect body params"})
    }
    aerospikeApi.addNew({name: body.name.toLowerCase()},function(err,response){
        console.log(" resp-->",response,err)
        if(err){
            res.status(500).json({err:err,'message':'Please try again after sometime'});
            return;
        }
        return res.send({msg:'success'});
    })
};


