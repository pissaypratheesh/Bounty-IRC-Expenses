/**
 * Created by m01352 on 20/03/17.
 */

'use strict';
var _ = require('underscore');

_.mixin(require('../../mixins'));

var calculateGiven = function(user, toUser,data){
    var userObj =  {
        summary : {
            debits: 0,
            credits: 0
        },
        history: [],
        curr_debits : {},
        curr_credits: {}
    };
    !user && (user = userObj);
    !toUser && (toUser = userObj);

    console.log("\n\n user details -->",user,toUser,data)

    var amount = Number(data.amount);
    //update summary of both
    user.summary.credits = Number(user.summary.credits) + amount;
    toUser.summary.debits = Number(toUser.summary.debits) + amount;

    //update history of both
    user.history.push({to:data.to, amount:amount, time:data.timestamp , msg: data.msg || "", type: "given to "+ data.to});
    toUser.history.push({to:data.user, amount:amount, time:data.timestamp , msg: data.msg || "", type: "received from "+ data.user})

    //update curr objects of both
    if(_.at(user,'curr_credits.' + data.to)){
        user.curr_credits[data.to].amount += amount
    }else {
        user.curr_credits[data.to] = { amount: amount}
    }
    if(_.at(toUser,'curr_debits.' + data.user)){
        user.curr_credits[data.user].amount += amount
    }else {
        user.curr_credits[data.user] = { amount: amount}
    }

    console.log("\n\n AT enduser details -->",user,toUser)

    return {
        user: user,
        toUser: toUser
    }
};

var calculateTaken = function (user, toUser, data) {
    var amount = Number(data.amount);
    console.log("\n\n user details -->",user,toUser,data)
    var userObj = {
        summary : {
            debits: 0,
            credits: 0
        },
        history: [],
        curr_debits : {},
        curr_credits: {}
    };
    !user && (user = userObj);
    !toUser && (toUser = userObj);

    //update summary of both
    user.summary.debits = Number(user.summary.debits) + amount;
    toUser.summary.credits = Number(toUser.summary.credits) + amount;

    //update history of both
    user.history.push({user:data.from, amount:amount, time:data.timestamp , msg: data.msg || "", type: "taken from "+ data.from});
    toUser.history.push({user:data.user, amount:amount, time:data.timestamp , msg: data.msg || "", type: "given to "+ data.user})

    //update curr objects of both
    if(_.at(user,'curr_debits.' + data.from)){
        user.curr_debits[data.from].amount += amount
    }else {
        user.curr_credits[data.from] = { amount: amount}
    }
    if(_.at(toUser,'curr_credits.' + data.user)){
        user.curr_credits[data.user].amount += amount
    }else {
        user.curr_credits[data.user] = { amount: amount}
    }
    return {
        user: user,
        toUser: toUser
    }
};

exports.updateRec = function(options, callback) {
    var user = options.user,
        toUser = options.toUser,
        data = options.data;

    if(data.type === "give"){
        return calculateGiven(user, toUser, data);
    }
    else {
        return calculateTaken(user, toUser, data);
    }
};

