/*
 * Overide net native module
 */

var net = require('net');

module.exports = net;

var _listen = net.Server.prototype.listen;
net.Server.prototype.listen = function() {
	var port;

	if (!http.AppHouse)
		return;

	if (arguments[0] == http.AppHouse.standardPort || arguments[0] == 80 || !arguments.length)
		port = http.AppHouse.standardPort;
	else if (arguments[0] in http.AppHouse.allowPorts)
		port = arguments[0];
	else
		throw Error('Cannot listen on port ' + arguments[0]);

	_listen.apply(this, [ port ]);
};
