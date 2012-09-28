var Express_Server = require('./lib/express-server').Express_Server;
var Multiply_Handler = require('./lib/multiply-handler').Multiply_Handler;
var server = new Express_Server();
server.api_handler = new Multiply_Handler();
server.initialize('config.json');
server.start();
