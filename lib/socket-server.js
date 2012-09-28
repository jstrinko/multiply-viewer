var Http = require('http');
var SocketIO = require('socket.io');
var Sys = require('sys');
var Server = require('./server').Server;

var Socket_Server = function() {
    Server.call(this);
};

Sys.inherits(Socket_Server, Server);

Socket_Server.prototype.server = Http.createServer();
Socket_Server.prototype.start = function() {
    this.io = SocketIO.listen(this.server);
    var server = this;
    this.io.on('connection', function(socket) {
	console.log("Got a connection");
	server.init_socket_listeners(socket);
    });  
    this.server.listen(this.config.socket_port);
};
Socket_Server.prototype.init_socket_listeners = function(socket) {
    var server = this;
    socket.on('request', function(data) {
	data.socket = socket;
	if (data.uri) {
	    server.handle_uri(data.uri, data);
	}
    });
};
Socket_Server.prototype.handle_uri = function(uri, data) {
    match = this.find_route(uri);
    var route = match.route;
    data.route = match.route;
    data.route_uri = match.route_uri;
    if (!data.params) { data.params = {}; }
    for(var x in match.params) {
	data.params[x] = match.params[x];
    }
    if (route) {
	if (route.method == 'api') {
	    this.api_response(data);
	}
	else if (route.method == 'collection') {
	    this.collection_response(data);
	}
	else {
	    this.normal_response(data);
	}
    }
};
Socket_Server.prototype.send_response = function(data) {
    var socket = data.socket;
    var response = {
	"uri": data.uri,
	"route": data.route,
	"route_uri": data.route_uri,
	"params": data.params,
	"response_body": data.response_body
    };
    for(var x in data.set) {
	response[x] = data.set[x];
    }
    socket.emit('response', response);
};
Socket_Server.prototype.set_routes = function() { /* not needed */ };
Socket_Server.prototype.find_route = function(uri) {
    var uri_parts = uri.split('\/');
    var match = {
	uri: uri
    };
    for(var route_uri in this.routes.routes) {
	var route_parts = route_uri.split('\/');
	match.params = {};
	var ok = true;
	for(var x=0; x<route_parts.length; x++) {
	    var route_part = route_parts[x];
	    var uri_part = uri_parts[x];
	    if (uri_part === 'undefined') {
		ok = false;
		break;
	    }
	    else if (route_part.substr(0,1) == ':') {
		match.params[route_part.substr(1)] = uri_part;
	    }
	    else if (route_part != uri_part) {
		ok = false;
		break;
	    }
	}
	if (ok) {
	    match.route = this.routes.routes[route_uri];
	    match.route_uri = route_uri;
	    break;
	}
    }
    return match;
};
exports.Socket_Server = Socket_Server;
