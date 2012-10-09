var Client = function() {
    this.next_request_id = 1;
    this.cache = {};
    this.callback_map = {};
    this.has_connected = false;
    this.initialize = function() {
	this.router = new App_Router();
	this.router.set_app(this);
	this.socket_server = "http://" + GLOBAL_hostname + ":" + GLOBAL_config.port;
	this.socket = io.connect(this.socket_server);
	this.init_socket();
    };
    this.init_socket = function() {
	var client = this;
	this.socket.on('connect', function() {
	    client.socket.on('response', function(data) {
		client.handle_response(data);
	    });
	    if (!this.has_connected) {
		this.has_connected = true;
		Backbone.history.start();
		client.router.navigate();
	    }
	});
    };
    this.handle_response = function(data) {
	var params = data.params;
	if (params && params.request_id && this.callback_map[params.request_id]) {
	    this.callback_map[params.request_id](data);
	    delete this.callback_map[params.request_id];
	}
    };
    this.read = function(uri, callback) {
	var request_id = this.get_request_id();
	if (callback) {
	    this.set_request_callback(request_id, callback);
	}
	this.socket.emit('request', { uri: uri, params: { request_id: request_id }});
    };
    this.get_request_id = function() {
	return this.next_request_id++;
    };
    this.set_request_callback = function(request_id, callback) {
	this.callback_map[request_id] = callback;
    };
};

var Single_Client = new Client();

function main() {
    Single_Client.initialize();
}

var App_Router = Backbone.Router.extend({
    routes: {
	"": "show_main",
	"add-user/:step": "add_user"
    },
    initialize: function() {
	var body_view = new Body_View({ model: new Body() });
    },
    show_main: function() {
	var router = this;
	this.app.read("/api/users", function(data) {
	    var users = data.response_body.users;
	    if (users.length) {

	    }
	    else {
		router.navigate('add-user/start', { trigger: true });
	    }
	});
    },
    set_app: function(app) {
	this.app = app;
    },
    show_status_callback: function(container, data) {
	$(container).html(JST['htdocs/scripts/templates/status']({ container: container, data: data }));
    },
    please_wait: function(container) {
	$(container).html(JST['htdocs/scripts/templates/please_wait']());
    },
    add_user: function(step) {
	if (step == 'start') {
	    $('content').html(JST['htdocs/scripts/templates/add_user_start']());
	}
    }
});
