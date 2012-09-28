var Body_View = Backbone.View.extend({
    initialize: function() {
        _.bindAll(this, 'render');
        this.model.on('change', this.render);
        this.model.on('destroy', this.remove);
	this.template = JST['./htdocs/scripts/templates/body.jst'];
	this.render();
    },
    render: function() {
        $('body').html(this.template(this.model.toJSON()));
        return this;
    }
});
