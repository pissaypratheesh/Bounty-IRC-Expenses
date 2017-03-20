'use strict';
var http = require('http'),
    express = require('express'),
    app = express(),
    config = require(__dirname + '/config.js'),
    bodyParser = require('body-parser'),
    aerospikeApi = require('./lib/api'),
    favicon = require('serve-favicon'),
    methodOverride = require('method-override');


app.use(bodyParser.json());

// override with different headers; last one takes precedence
app.use(methodOverride('X-HTTP-Method'));          // Microsoft
app.use(methodOverride('X-HTTP-Method-Override')); // Google/GData
app.use(methodOverride('X-Method-Override'));      // IBM
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());
app.set('views', __dirname + '/public');
app.engine('.html', require('jade').__express);

//Make database connection and start the express app
aerospikeApi.connect(function(err){
    if(err){
        console.error("\nAerospike database connection error: ",err);
        return;
    }
    console.log("\n\n connected successfully")
    startExpress();
});



/*
 * Store the db connection and start listening on a port.
 */
function startExpress() {
    http.globalAgent.maxSockets = Infinity;
    var port = (process.env.NODE_ENV === "production") ? config.express.prodPort : config.express.port;
    console.log('Listening on port ' + port);
    http.createServer(app).listen(port, function() {
        console.log('IRC  started on port: ', port );
    });
}



// Attach main routes here
require('./routes')(app);

//If we reach this middleware the route could not be handled and must be unknown.
app.use(handle404);

//Generic error handling middleware.
app.use(handleError);

/*
 * Page-not-found middleware.
 */
function handle404(req, res, next) {
    res.status(404).end('Not found');
}

/*
 * Generic error handling middleware.
 * Send back a 500 page and log the error to the console.
 */
function handleError(err, req, res, next) {
    console.error("\nError:",err,"\n Error msg:",err.message,"\n Error stack:",err.stack);
    res.status(500).json({err: err.message});
}

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) aerospikeApi.shutdown();
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));