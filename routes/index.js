module.exports = function(app) {
    //The REST routes for shortening.
    var inLb = true;
    app.get("/healthcheck", function(req,res){
        if(inLb){
            return res.send({status: "success"});
        }
        return res.status(404).send({status:"failure"});
    });

    app.route('/transaction')
        .post(require('./addTransaction').addTransaction);

    app.route('/addUser')
        .post(require('./addUser').addUser);

    app.route('/batchRead')
        .post(require('./getTransaction').getTransaction);

    app.route('/getData')
        .post(require('./getUserData').getUserData);
};
