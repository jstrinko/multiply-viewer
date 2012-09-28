var Express_Server = require('./lib/express-server').Express_Server;
var server = new Express_Server();
server.initialize('config.json');
server.start();
