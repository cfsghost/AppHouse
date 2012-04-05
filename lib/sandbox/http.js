/*
 * Overide http native module
 */

var http = require('http');
var network = require('./network');

module.exports = http;

/* Override */
var _listen = http.Server.prototype.listen;
http.Server.prototype.listen = function() {
	if (!http.AppHouse)
		return;

	/* request a port number */
	var port = network.requestPort(http.AppHouse, arguments[0]);

	if (port == http.AppHouse.standardPort)
		_listen.apply(this, [ http.AppHouse.standardPortHub ]);
	else
		_listen.apply(this, [ port ]);

	/* store server connections */
	http.AppHouse.serverConnections.push(this);
};

var _listen2 = http.Server.prototype.listen2;
http.Server.prototype.listen2 = function() {
	if (!http.AppHouse)
		return;

	/* request a port number */
	var port = network.requestPort(http.AppHouse, arguments[1]);

	_listen2.apply(this, [ arguments[0], port, arguments[1] ]);

	/* store server connections */
	http.AppHouse.serverConnections.push(this);
};
