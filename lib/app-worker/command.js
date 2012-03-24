var AppHouse = require('../apphouse');
var fs = require('fs');
var path = require('path');

module.exports = function() {
	var self = this;

	this.command = function(cmd, args) {
		if (!self.hasOwnProperty(cmd))
			return;

		self[cmd].apply(this, args || []);
	};

	this.start = function(scriptPath) {
		/* Run application in sandbox */
		AppHouse.Sandbox(path.dirname(scriptPath));
	};
};
