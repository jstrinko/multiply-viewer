var Socket_Server = require('./lib/socket-server').Socket_Server;
var Multiply_Handler = require('./lib/multiply-handler').Multiply_Handler;
var server = new Socket_Server();
server.api_handler = new Multiply_Handler();
server.initialize('config.json');
server.start();

