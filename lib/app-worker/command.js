var AppHouse = require('../apphouse');
var fs = require('fs');

module.exports = function() {
	var self = this;

	this.command = function(cmd, args) {
		if (!self.hasOwnProperty(cmd))
			return;

		self[cmd].apply(this, args || []);
	};

	this.start = function(path) {
		code = fs.readFileSync(path, 'ascii');

		/* Run application in sandbox */
		AppHouse.Sandbox(code);
	};
};
