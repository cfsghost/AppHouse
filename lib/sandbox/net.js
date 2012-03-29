/*
 * Overide net native module
 */

var net = require('net');
var network = require('./network');

module.exports = net;

/* Override */
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

var _listen2 = net.Server.prototype.listen2;
net.Server.prototype.listen2 = function() {
	if (!net.AppHouse)
		return;

	/* request a port number */
	var port = network.requestPort(net.AppHouse, arguments[1]);

	_listen2.apply(this, [ arguments[0], port, arguments[1] ]);

	/* store server connections */
	net.AppHouse.serverConnections.push(this);
};
