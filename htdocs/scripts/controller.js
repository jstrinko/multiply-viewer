var App = {
    cache: {},
};

function main() {
    App.router = new App_Router();
    App.router.set_app(App);
    Backbone.history.start();
    App.router.navigate();
}

var App_Router = Backbone.Router.extend({
    routes: {
	"": "show_main",
    },
    initialize: function() {
	var body_view = new Body_View({ model: new Body() });
    },
    show_main: function() {
	
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
