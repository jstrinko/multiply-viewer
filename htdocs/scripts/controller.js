var Client = function() {
    this.cache = {};
    this.initialize = function() {
	this.router = new App_Router();
	this.router.set_app(this);
	this.socket_server = "http://" + GLOBAL_hostname + ":" + GLOBAL_config.socket_port;
	this.socket = io.connect(this.socket_server);
	this.init_socket();
    };
    this.init_socket = function() {
	var client = this;
	this.socket.on('connect', function() {
	    client.socket.on('response', function(data) {
		client.handle_response(data);
	    });
	    Backbone.history.start();
	    client.router.navigate();
	});
    };
    this.handle_response = function(data) {
	$('body').html(JSON.stringify(data));
    };
};

var Single_Client = new Client();

function main() {
    Single_Client.initialize();
}

var App_Router = Backbone.Router.extend({
    routes: {
	"": "show_main",
    },
    initialize: function() {
	var body_view = new Body_View({ model: new Body() });
    },
    show_main: function() {
	this.app.socket.emit('request', { "uri": "/api/user" });
    },
    set_app: function(app) {
	this.app = app;
    },
    show_status_callback: function(container, data) {
	$(container).html(JST['htdocs/scripts/templates/status']({ container: container, data: data }));
    },
    please_wait: function(container) {
	$(container).html(JST['htdocs/scripts/templates/please_wait']());
    }
});
