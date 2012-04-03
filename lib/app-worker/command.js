var AppHouse = require('../apphouse');
var Manager = require('./syscall/manager');
var fs = require('fs');
var path = require('path');

module.exports = function(_sandbox, _ipc) {
	var self = this;
	var sandbox = _sandbox;
	var ipc = _ipc;

	this.command = function(cmd, args) {
		if (!self.hasOwnProperty(cmd))
			return;

		self[cmd].apply(this, args || []);
	};

	/*
	 * Start Application
	 */
	this.start = function(scriptPath) {
		if (!sandbox.running) {
			/* Support internal APIs for manager */
			if (sandbox.properties.isManager) {
				sandbox.properties.Manager = new Manager(process, ipc);
			}

			/* Run application in sandbox */
			sandbox.run(path.dirname(scriptPath));
		}

		process.send({
			type: 'event',
			name: 'appStarted'
		});
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
