var Socket_Server = require('./lib/socket-server').Socket_Server;
var server = new Socket_Server();
server.initialize('config.json');
server.start();

