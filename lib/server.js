var FS = require('fs');
var Glob = require('glob');
var OS = require('os');
var Express = require('express');
var Http = require('http');
var SocketIO = require('socket.io');

var Server = function() {
    this.cache = {};
};
Server.prototype.start = function() {
    var sexio = this;
    this.io.on('connection', function(socket) {
        console.log("Got a connection");
        sexio.init_socket_listeners(socket);
    });
    this.server.listen(this.config.port);
};
Server.prototype.initialize = function(config_file) {
    this.app = Express();
    this.server = Http.createServer(this.app);
    this.io = SocketIO.listen(this.server);
    this.config_file = config_file;
    this.load_config();
    this.load_routes();
    this.set_collections();
    this.set_routes();
    this.hostname = OS.hostname();
};
Server.prototype.set_collections = function() {
    this.cache.collections = {};
    for(var id in this.routes.collections) {
	this.build_collection(id);
    }
};
Server.prototype.build_collection = function(id) {
    var collection = this.routes.collections[id];
    var parts = new Array();
    var jst_parts = new Array();
    for(var x=0; x<collection.files.length; x++) {
	var filesearch = './htdocs' + collection.files[x];
	var files = Glob.sync(filesearch);
	for(var y=0; y<files.length; y++) {
	    var file = files[y];
	    if (file.match(/.*\.jst$/)) {
		jst_parts.push(file);
	    }
	    else {
		parts.push(FS.readFileSync(file, 'ascii'));
	    }
	}
    }
    if (jst_parts.length > 0) {
	parts.push('(function(){ window.JST = window.JST || {};');
	for(var x=0; x<jst_parts.length; x++) {
	    var file = jst_parts[x];
	    var contents = FS.readFileSync(file, 'ascii');
	    contents = contents.replace(/\n/g, '\\n').replace(/'/g, "\\'");
	    parts.push("window.JST['" + file + "'] = _.template('" + contents + "');");
	}
	parts.push('})();');
    }
    if (collection.include_vars) {
	for(var x=0; x<collection.include_vars.length; x++) {
	    var name = collection.include_vars[x];
	    parts.push('var GLOBAL_' + name + ' = ' + JSON.stringify(this[collection.include_vars[x]]));
	}
    }
    this.cache.collections[id] = parts.join('\n');
};
Server.prototype.load_routes = function() {
    try {
	this.routes = JSON.parse(FS.readFileSync('config/routes.json', 'ascii'));
    }
    catch(err) {
	console.error("Unable to load routes.json: " + err);
	process.exit(1);
    }
};
Server.prototype.load_config = function() {
    try {
	this.config = JSON.parse(FS.readFileSync('config/' + this.config_file, 'ascii'));
    }
    catch(err) {
	console.error("Unable to load config.json: " + err);
    }
};
Server.prototype.api_response = function(data) {
    if (!data.set) { data.set = {}; }
    data.server = this;
    data.set['Content-Type'] = 'application/json';
    if (this.api_handler) {
	this.api_handler.handle(data);
    }
    else {
	this.send_response(data);
    }
};
Server.prototype.normal_response = function(data) {
    if (!data.set) { data.set = {}; }
    var local = this.routes.routes[data.path].local;
    if (local) {
	data.response_body = FS.readFileSync('./htdocs' + local + '.html', 'ascii');
    }
    else {
	data.response_body = "Not found: " + data.path;
    }
    data.set['Content-Type'] = 'text/html';
    this.send_response(data);
};
Server.prototype.collection_response = function(data) {
    if (!data.set) { data.set = {}; }
    var id = data.params.id
    var collection = this.routes.collections[id];
    if (collection.content_type) {
	data.set['Content-Type'] = collection.content_type;
    }
    else {
	data.set['Content-type'] = 'text/html';
    }
    if (this.config.no_cache) {
	this.build_collection(id);
    }
    data.response_body = this.cache.collections[id];
    this.send_response(data);
};
Server.prototype.set_routes = function() {
    var server = this;
    for(var uri in this.routes.routes) {
        var route = this.routes.routes[uri];
        if (route.method == 'api') {
            this.app.all(uri, function(req, res) {
                server.api_response(server.build_data(req, res, 'http'));
            });
        }
        else if (route.method == 'collection') {
            this.app.all(uri, function(req, res) {
                server.collection_response(server.build_data(req, res, 'http'));
            });
        }
        else {
            this.app.all(uri, function(req, res) {
                server.normal_response(server.build_data(req, res, 'http'));
            });
        }
    }
};
Server.prototype.build_data = function(req, res, type) {
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
        set: {},
	type: type
    };
};
Server.prototype.send_response = function(data) {
    if (data.type == 'http') {
	if (data.set) {
	    for(var x in data.set) {
		data.res.set(x, data.set[x]);
	    }
	}
	data.res.send(data.response_body);
    }
    else if (data.type == 'socket') {
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
    }
    else {
    	console.log("Unrecognized type of response: " + data.type);
    }
};
Server.prototype.init_socket_listeners = function(socket) {
    var server = this;
    socket.on('request', function(data) {
        data.socket = socket;
        if (data.uri) {
            server.handle_socket_uri(data.uri, data);
        }
    });
};
Server.prototype.handle_socket_uri = function(uri, data) {
    match = this.find_route(uri);
    var route = match.route;
    data.route = match.route;
    data.route_uri = match.route_uri;
    data.type = 'socket';
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
Server.prototype.find_route = function(uri) {
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

exports.Server = Server;
