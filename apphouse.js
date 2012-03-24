var http = require('http');
var config = require('config');
var AppHouse = require('./lib/apphouse.js');

/* Config */
config.path.app = config.path.app || __dirname + '/apps'

/* Initializing Application Manager */
var appMgr = new AppHouse.AppManager(config.path.app);
appMgr.runAll();

http.createServer(function (req, res) {
	console.log(req.header);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('AppHouse Hosting Platform\n');
}).listen(8000);
