var AppHouse = require('../apphouse');
var fs = require('fs');
var path = require('path');

module.exports = function(_sandbox) {
	var self = this;
	var sandbox = _sandbox;

	this.command = function(cmd, args) {
		if (!self.hasOwnProperty(cmd))
			return;

		self[cmd].apply(this, args || []);
	};

	/*
	 * Start Application
	 */
	this.start = function(scriptPath) {
		if (!sandbox.running)
			/* Run application in sandbox */
			sandbox.run(path.dirname(scriptPath));
	};

	/*
	 * Stop Application
	 */
	this.stop = function() {
		process.exit();
	};

	/*
	 * Setting
	 */
	this.set = function() {
		if (arguments[0] instanceof Object) {
			for (var key in arguments[0]) {
				sandbox.properties[key] = arguments[0][key];
			}
		} else {
			sandbox.properties[arguments[0]] = arguments[1];
		}
	};
};
