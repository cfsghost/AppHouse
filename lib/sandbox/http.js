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

	/* Request a port number */
	var port = network.requestPort(http.AppHouse, arguments[0]);

	_listen.apply(this, [ port ]);

	/* Store server connections */
	http.AppHouse.serverConnections.push(this);
};
