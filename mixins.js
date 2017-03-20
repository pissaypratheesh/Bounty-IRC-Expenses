"use strict";
// wip
var _ = require('underscore');

module.exports = {
    at: at,
    inherits: inherits,
    deepExtend: deepExtend,
    sub: sub,
    trim: trim,
    capitalize: capitalize,
    currency: currency,
    trace: trace,
    bool: bool,
    remove: remove,
    querify:querify,
    dequerify:dequerify,
    isOneSize:isOneSize,
    validate:validate,
    trimToLength:trimToLength,
    expires: getRemainingDayHours
};

// at(o, 'a.b.c') // returns o.a.b.c, if it exists. use with caution.
// def => default

function at(o, path, def) {
    var pointer = o,
        failed = false;

    if (!o || !path) {
        return o;
    }
    _.each(path.split('.'), function(p) {
        if (pointer[p] !== null && pointer[p] !== undefined && !failed) {
            pointer = pointer[p];
        } else {
            failed = true;
        }
    });
    return failed ? (o[path] || def) : pointer;
}


// from YUI. simple string interpolation. love it. 

function sub(str, locals) {
    var SUBREGEX = /\{\s*([^|}]+?)\s*(?:\|([^}]*))?\s*\}/g;
    return str.replace ? str.replace(SUBREGEX, function(match, key) {
        return _.isUndefined(locals[key]) ? match : locals[key];
    }) : str;
}

function trim(str) {
    str = str || '';
    return String.prototype.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function trimToLength(m, str) {
    return (str.length > m) ? str.trim().substring(0, m) + "..." : str;
}

function inherits(child, parent) {
    // this requires that you call the parent constructor inside the child constructor.
    // eg - 
    // ```
    // function widget(){
    //   events.EventEmitter.call(this);    
    //   // or, but not recommended
    //   this.superclass.constructor.call(this);
    // }
    // _.inherits(widget, events.EventEmitter);

    // ```


    // first get all the static members/methods onto the parent
    _.extend(child, parent);

    function Ctor() {
        this.constructor = child;
    }
    Ctor.prototype = parent.prototype;
    // ahem. so the new class' `prototype` is set to an object created with constructor === child && prototype === parent's prototype.
    // this is to "preserve the prototype chain", as they say.
    child.prototype = new Ctor();
    child.superclass = parent.prototype; // todo - argue.     

    return child;
}
// deepExtend, via https://gist.github.com/kurtmilam/1868955

/*  Copyright (C) 2012-2013  Kurt Milam - http://xioup.com | Source: https://gist.github.com/1868955
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 **/

// Based conceptually on the _.extend() function in underscore.js ( see http://documentcloud.github.com/underscore/#extend for more details )

function deepExtend(obj) {
    var parentRE = /#{\s*?_\s*?}/,
        slice = Array.prototype.slice,
        hasOwnProperty = Object.prototype.hasOwnProperty;

    _.each(slice.call(arguments, 1), function(source) {
        _.each(source, function(_v_, prop) {
            if (_.isUndefined(obj[prop]) || _.isFunction(obj[prop]) || _.isNull(source[prop])) {
                obj[prop] = source[prop];
            } else if (_.isString(source[prop]) && parentRE.test(source[prop])) {
                if (_.isString(obj[prop])) {
                    obj[prop] = source[prop].replace(parentRE, obj[prop]);
                }
            } else if (_.isArray(obj[prop]) || _.isArray(source[prop])) {
                if (!_.isArray(obj[prop]) || !_.isArray(source[prop])) {
                    throw 'Error: Trying to combine an array with a non-array (' + prop + ')';
                } else {
                    obj[prop] = _.reject(deepExtend(obj[prop], source[prop]), function(item) {
                        return _.isNull(item);
                    });
                }
            } else if (_.isObject(obj[prop]) || _.isObject(source[prop])) {
                if (!_.isObject(obj[prop]) || !_.isObject(source[prop])) {
                    throw 'Error: Trying to combine an object with a non-object (' + prop + ')';
                } else {
                    obj[prop] = deepExtend(obj[prop], source[prop]);
                }
            } else {
                obj[prop] = source[prop];
            }
        });

    });
    return obj;
}

/**
 * Dependency: underscore.js ( http://documentcloud.github.com/underscore/ )
 *
 * Mix it in with underscore.js:
 * _.mixin({deepExtend: deepExtend});
 *
 * Call it like this:
 * var myObj = _.deepExtend(grandparent, child, grandchild, greatgrandchild)
 *
 * Notes:
 * Keep it DRY.
 * This function is especially useful if you're working with JSON config documents. It allows you to create a default
 * config document with the most common settings, then override those settings for specific cases. It accepts any
 * number of objects as arguments, giving you fine-grained control over your config document hierarchy.
 *
 * Special Features and Considerations:
 * - parentRE allows you to concatenate strings. example:
 *   var obj = _.deepExtend({url: "www.example.com"}, {url: "http://#{_}/path/to/file.html"});
 *   console.log(obj.url);
 *   output: "http://www.example.com/path/to/file.html"
 *
 * - parentRE also acts as a placeholder, which can be useful when you need to change one value in an array, while
 *   leaving the others untouched. example:
 *   var arr = _.deepExtend([100,    {id: 1234}, true,  "foo",  [250, 500]],
 *                          ["#{_}", "#{_}",     false, "#{_}", "#{_}"]);
 *   console.log(arr);
 *   output: [100, {id: 1234}, false, "foo", [250, 500]]
 *
 * - The previous example can also be written like this:
 *   var arr = _.deepExtend([100,    {id:1234},   true,  "foo",  [250, 500]],
 *                          ["#{_}", {},          false, "#{_}", []]);
 *   console.log(arr);
 *   output: [100, {id: 1234}, false, "foo", [250, 500]]
 *
 * - And also like this:
 *   var arr = _.deepExtend([100,    {id:1234},   true,  "foo",  [250, 500]],
 *                          ["#{_}", {},          false]);
 *   console.log(arr);
 *   output: [100, {id: 1234}, false, "foo", [250, 500]]
 *
 * - Array order is important. example:
 *   var arr = _.deepExtend([1, 2, 3, 4], [1, 4, 3, 2]);
 *   console.log(arr);
 *   output: [1, 4, 3, 2]
 *
 * - You can remove an array element set in a parent object by setting the same index value to null in a child object.
 *   example:
 *   var obj = _.deepExtend({arr: [1, 2, 3, 4]}, {arr: ["#{_}", null]});
 *   console.log(obj.arr);
 *   output: [1, 3, 4]
 *
 **/

// inserts commas, rounds decimals
// and adds currency symbol
function currency(number) {
    var num = (Math.round(number)).toString(),
        one = (num == 1) ? true : false,
        arr = [],
        digits,
        curr;

    while (num) {
        digits = digits ? 2 : 3;
        arr.push(num.slice(-digits));
        num = num.slice(0, -digits);
    }

    curr = arr.reverse().join(',');
    curr = (one ? 'Re. ' : 'Rs. ') + curr;

    return curr;
}


// cheap stacktrace at any point. 
function trace() {
    try {
        this.will.not.work.at.all;
    } catch (e) {
        console.log(e.stack);
    }
}


//return boolean 0,1,"0", "1" , true, false, 'true', 'false'

function bool(val) {
    if (_.contains(['true', true, '1', 1], val)) {
        return true;
    } else if (_.contains(['false', false, '0', 0], val)) {
        return false;
    }
    return val;
}

// Removes the elements from an object if the iterator return true
// Added because reject returns array and does not work for objects
function remove(obj, fn) {
    obj = _.clone(obj);
    _.each(obj, function(val, key) {
        fn(val, key) && delete obj[key];
    });
    return obj;
}

//Replace whitespaces with '-' and convert to lowercase
function querify(str) {
    if (str)
        return trim(str.replace(/\s/img, '-').toLowerCase().replace(/\//mg, '%2F'));
    else return '';
}

//Replace  '-' with whitespaces and convert to lowercase
function dequerify(str) {
    if (str)
        return trim(str.replace(/\-/img, ' ').replace(/\%2F/g, '/').toLowerCase());
    else return '';
}

function isOneSize(str) {
    var oneSizeReg = /one\ size|onesize|freesize|free\ size|set|^(\d*\.?\d*)[cmg][ml]*$/i;
    return oneSizeReg.test(str);
}

/*
 * validates the given object according to the types specified in template
 * eg : template { 'key1' : 'boolean', 'key2': 'string'} validates { key1: true, key2: 'test'}
 * returns true if valid or { key : keyname , exprectedType : type, foundType : type}
 */
function validate(object, template) {

    for (var key in template) {
        if (object[key] === undefined || (typeof object[key] !== template[key])) {
            return {
                'key': key,
                expectedType: template[key],
                foundType: typeof object[key]
            };
        }
    }

    return true;
}

/*
Typed by: Arun Kumar
Department: Rev-labs
Description: Takes date in milliseconds as an argument and returns a message of remaining time and a boolean set to true
if remaining time is less than 2 days
*/

function getRemainingDayHours(milli){
    //milliseconds in a day and in an hour
    var dayInMilli = 24 * 60 * 60 * 1000,
        hoursInMilli = 60 * 60 * 1000,
        dayPart = milli/dayInMilli,
        day = Math.floor(dayPart),
        hourPart = day - Math.floor(day), //Finding out fraction part of day
        hours = Math.floor((hourPart*dayInMilli)/hoursInMilli), //Converting fraction to hours
        isByMorrow = day < 2? true: false,
        message = '';

        if(day === 0){
            message = hours + ' hours left';
        }
        else if(day === 1){
            message = '1 day' + hours + ' hours left';
        }

        return{
            byMorrow: isByMorrow,
            info: message
        };

}

/* End  */
