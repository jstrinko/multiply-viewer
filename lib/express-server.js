var Express = require('express');
var Server = require('./server').Server;
var Sys = require('sys');

var Express_Server = function() { 
    Server.call(this);
};

Sys.inherits(Express_Server, Server);

Express_Server.prototype.app = Express();
Express_Server.prototype.start = function() {
    this.app.listen(this.config.express_port);
};
Express_Server.prototype.set_routes = function() {
    var server = this;
    for(var uri in this.routes.routes) {
	var route = this.routes.routes[uri];
	if (route.method == 'api') {
	    this.app.all(uri, function(req, res) {
		server.api_response(server.build_data(req, res));
	    });
	}
	else if (route.method == 'collection') {
	    this.app.all(uri, function(req, res) {
		server.collection_response(server.build_data(req, res));
	    });
	}
	else {
	    this.app.all(uri, function(req, res) {
		server.normal_response(server.build_data(req, res));
	    });
	}
    }
};
Express_Server.prototype.build_data = function(req, res) {
    var all_params = {};
    for(var x in req.query) {
	all_params[x] = req.query[x];
    }
    for(var x in req.body) {
	all_params[x] = req.body[x];
    }
    for(var x in req.params) {
	all_params[x] = req.params[x];
    }
    return {
	params: all_params,
	path: req.path,
	req: req,
	res: res,
	set: {}
    };
};
Express_Server.prototype.send_response = function(data) {
    if (data.set) {
	for(var x in data.set) {
	    data.res.set(x, data.set[x]);
	}
    }
    data.res.send(data.response_body);
};
exports.Express_Server = Express_Server;
