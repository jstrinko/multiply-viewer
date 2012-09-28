var FS = require('fs');
var Glob = require('glob');

var Server = function() {
    this.cache = {};
};
Server.prototype.initialize = function(config_file) {
    this.config_file = config_file;
    this.load_config();
    this.load_routes();
    this.set_collections();
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
    this.cache.collections[id] = parts.join('\n');
};
Server.prototype.load_routes = function() {
    try {
	this.routes = JSON.parse(FS.readFileSync('routes.json', 'ascii'));
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
    data.response_body = 'api request';
    data.set['Content-Type'] = 'application/json';
    this.send_response(data);
};
Server.prototype.normal_response = function(data) {
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
Server.prototype.send_response = function(data) {
    console.error("This method must be overridden");
    process.exit(1);
};
Server.prototype.set_routes = function() {
    console.error("This method must be overridden");
    process.exit(1);
};

exports.Server = Server;
