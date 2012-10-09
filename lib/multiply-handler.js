var MongoDB = require('mongodb');

var Multiply_Handler = function() { 
    this.mongo_server = new MongoDB.Server('localhost', MongoDB.Connection.DEFAULT_PORT, { auto_reconnect: true });
    this.mongo_db = new MongoDB.Db('multiply', this.mongo_server);
}

Multiply_Handler.prototype.initialize = function(callback) {
    var handler = this;
    handler.mongo_db.open(function(err, db) {
	if (!err) {
	    callback();
	}
    });
};

Multiply_Handler.prototype.handle = function(data) {
    var params = data.params;
    return this[params.id](data);
};

Multiply_Handler.prototype.users = function(data) {
    var handler = this;
    handler.mongo_db.collection('users', function(err, collection) {
	collection.find().toArray(function(err, users) {
	    data.response_body = { users: users };
	    data.server.send_response(data);
	});
    });
};

exports.Multiply_Handler = Multiply_Handler;
