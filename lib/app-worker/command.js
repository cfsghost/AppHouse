var AppHouse = require('../apphouse');
var Manager = require('./syscall/manager');
var Logger = require('./logger');
var fs = require('fs');
var path = require('path');

module.exports = function(_sandbox, _ipc) {
	var self = this;
	var sandbox = _sandbox;
	var ipc = _ipc;
	var App = {};

	this.command = function(cmd, args) {
		if (!self.hasOwnProperty(cmd))
			return;

		self[cmd].apply(this, args || []);
	};

	/*
	 * Initializing Environment
	 */
	this.init = function() {
		/* Initializing Logger */
		Logger(self.logger, App.appLogPath, function(err, logger) {
			if (err) {
				process.send({
					type: 'event',
					name: 'appInitError'
				});

				return;
			}

			self.logger = logger;

			/* Override stdout/stderr */
			process.stdout = self.logger.logStream;
			process.stderr = self.logger.logStream;

			/* Override console */
			console.log = function() {
				self.logger.log.apply(this, arguments);
			};

			console.info = function(msg) {
				self.logger.log.apply(this, arguments);
			};

			console.error = function(msg) {
				self.logger.log.apply(this, arguments);
			};

			console.warn = function(msg) {
				self.logger.log.apply(this, arguments);
			};

			/* Support internal APIs for manager */
			if (sandbox.properties.isManager) {
				sandbox.properties.Manager = new Manager(process, ipc);
			}

			process.send({
				type: 'event',
				name: 'appReady'
			});
		});
	};

	/*
	 * Start Application
	 */
	this.start = function() {
		if (!sandbox.running) {
			/* Run application in sandbox */
			sandbox.run(path.dirname(App.appPath));
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
		process.exit(0);
	};

	/*
	 * Set properties
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

	/*
	 * Application settings
	 */
	this.setApp = function() {
		App = arguments[0];
	};

	/*
	 * Set standard port hub
	 */
	this.setStandardPortHub = function(handle) {
		sandbox.properties.standardPortHub = handle;
	};
};
