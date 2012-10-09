var Server = require('./lib/server').Server;
var Multiply_Handler = require('./lib/multiply-handler').Multiply_Handler;
var server = new Server();
server.api_handler = new Multiply_Handler();
server.api_handler.initialize(function() {
    server.initialize('config.json');
    server.start();
});
