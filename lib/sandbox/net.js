/*
 * Overide net native module
 */

var net = require('net');

module.exports = net;

var _listen = net.Server.prototype.listen;
net.Server.prototype.listen = function() {
	if (!net.AppHouse)
		return;

	/* Request a port number */
	var port = network.requestPort(net.AppHouse, arguments[0]);

	_listen.apply(this, [ port ]);

	/* Store server connections */
	net.AppHouse.serverConnections.push(this);
};
