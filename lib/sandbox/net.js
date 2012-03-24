/*
 * Overide net native module
 */

var net = require('net');

module.exports = net;

var _listen = net.Server.prototype.listen;
net.Server.prototype.listen = function() {
	var port;

	if (!net.AppHouse)
		return;

	/* Only listen on 80 and ports we allow */
	if (arguments[0] == net.AppHouse.standardPort || arguments[0] == 80 || !arguments.length)
		port = net.AppHouse.standardPort;
	else if (arguments[0] in net.AppHouse.allowPorts)
		port = arguments[0];
	else if (net.AppHouse.serverConnections.length == 0)
		port = net.AppHouse.standardPort;
	else
		throw Error('Cannot listen on port ' + arguments[0]);

	_listen.apply(this, [ port ]);

	/* Store server connections */
	net.AppHouse.serverConnections.push(this);
};
