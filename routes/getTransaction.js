/**
 * Created by m01352 on 20/03/17.
 */
'use strict';
var _ = require('underscore'),
    aerospikeApi = require('../lib/api');

_.mixin(require('../mixins'));


exports.getTransaction = function (req, res, next) {
    var body = req.body;
    if(!(body.name1 && body.name2)){
        return res.status(500).json({'message':'invalid, try with name1 and name2'});
    }
    aerospikeApi.batchRead(body,function(err,response,meta){
        console.log(" resp-->",response,meta,err)
        if(err){
            res.status(500).json({err:err,'message':'Please try again after sometime'});
            return;
        }
        return res.send(response);
    })
};
