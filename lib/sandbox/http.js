/*
 * Overide http native module
 */

var http = require('http');

module.exports = http;

var _listen = http.Server.prototype.listen;
http.Server.prototype.listen = function() {
	var port;

	if (!http.AppHouse)
		return;

	/* Only listen on 80 and ports we allow */
	if (arguments[0] == http.AppHouse.standardPort || arguments[0] == 80 || !arguments.length)
		port = http.AppHouse.standardPort;
	else if (arguments[0] in http.AppHouse.allowPorts)
		port = arguments[0];
	else if (http.AppHouse.serverConnections.length == 0)
		port = http.AppHouse.standardPort;
	else
		throw Error('Cannot listen on port ' + arguments[0]);

	_listen.apply(this, [ port ]);

	/* Store server connections */
	http.AppHouse.serverConnections.push(this);
};
