/*
 * Overide http native module
 */

var http = require('http');

module.exports = http;

var _listen = http.Server.prototype.listen;
http.Server.prototype.listen = function() {
	_listen.apply(this, arguments);
};
