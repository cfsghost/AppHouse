/*
 * Overide net native module
 */

var net = require('net');

module.exports = net;

var _listen = net.Server.prototype.listen;
net.Server.prototype.listen = function() {
	_listen.apply(this, arguments);
};
