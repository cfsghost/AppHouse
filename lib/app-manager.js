var AppHouse = require('./apphouse');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

module.exports = function(_path, _logpath, _tools) {
	var self = this;
	var appPath = _path || 'apps';
	var logPath = _logpath || 'logs';
	var adminTools = _tools || [];
	var workerPath = path.join(__dirname, 'app-worker');
	var serial = 0;

	this.domains = {};
	this.applications = [];
	this.appPriv = [];

	this._startApp = function(id, callback) {
		var App = self.applications[id];
		var Priv = self.appPriv[id];

		/* Export Manager API */
		var targetLogPath = path.join(path.dirname(App.appPath), '.AppHouse_logs');

		path.exists(targetLogPath, function(exists) {
			if (exists) {
				child_process.spawn('umount', [ targetLogPath ]);
				fs.unlink(targetLogPath);
			}

			/* Mounting to export log directory if this app is a manager */
			if (App.isManager) {
				path.exists(targetLogPath, function(exists) {
					if (!exists) {
						fs.mkdir(targetLogPath, function() {
							child_process.spawn('mount', [ '--bind', logPath, targetLogPath ]);
						});
					} else {
						child_process.spawn('mount', [ '--bind', logPath, targetLogPath ]);
					}
				});
			}
		});

		/* Start Worker */
		var appProcess = child_process.fork(workerPath);

		App.starttime = new Date().getTime()
		Priv.process = appProcess;

		appProcess.on('exit', function(code) {
			var delay = 3000;
			App.state = 'stop';

			/* Delay 30 secs if retry many times already */
			if (App.retry >= 3) {
				delay = 30000;

				App.retry = 0;
			} else {
				App.retry++;
			}

			/* Try to restart */
			setTimeout(function() {
				self._startApp(id);
			}, delay);
		});

		/* Setup environment */
		appProcess.send({
			type: 'command',
			command: 'set',
			args: [{
				'appID': App.id,
				'standardPort': App.standardPort,
				'allowPorts': App.allowPorts,
				'isManager': App.isManager
			}]
		});

		appProcess.on('message', function(msg) {
			/* Export APIs for manager */
			if (App.isManager) {
				if (msg.type == 'mgrCommand') {
					switch(msg.command) {
					case 'getappinfo':
						var result = null;

						if (self.applications[msg.appID])
							result = self.applications[msg.appID];

						appProcess.send({
							type: 'callback',
							callback: msg.callback,
							args: [ result ]
						});

						break;

					case 'lsapp':
						appProcess.send({
							type: 'callback',
							callback: msg.callback,
							args: [ self.applications ]
						});
						break;

					case 'stopapp':
						self.stopApp(msg.appID);
						appProcess.send({
							type: 'callback',
							callback: msg.callback,
							args: [ true ]
						});
						break;

					case 'startapp':
						self._startApp(msg.appID, function() {
							appProcess.send({
								type: 'callback',
								callback: msg.callback,
								args: [ true ]
							});
						});
						break;

					case 'restartapp':
						self.stopApp(msg.appID);
						self._startApp(msg.appID, function() {
							appProcess.send({
								type: 'callback',
								callback: msg.callback,
								args: [ true ]
							});
						});
						break;

					}

					return;
				}
			}

			if (msg.type == 'event') {
				switch(msg.name) {
					case 'appStarted':
						App.state = 'running';

						/* Application was started, call callback function */
						if (callback)
							callback();
						break;
				}
			}
		});

		/* Start application */
		appProcess.send({
			type: 'command',
			command: 'start',
			args: [ App.appPath, App.appLogPath ]
		});
	};

	this.startApp = function(filename) {
		var dirPath = path.dirname(filename);
		var appName = path.basename(dirPath);
		var isManager = false;
		var id = serial++;
		var standardPort = 10000 + id;

		/* This application is a manager, it is able to use APIs to manage service */
		for (var index in adminTools) {
			if (appName == adminTools[index]) {
				isManager = true;
				break;
			}
		}

		/* Reading config */
		fs.readFile(path.join(dirPath, 'apphouse.cfg'), 'utf8', function(err, data) {
			/* Add to list */
			self.appPriv[id] = {
				process: null
			};
			self.applications[id] = {
				id: id,
				appName: appName,
				appPath: filename,
				appLogPath: path.join(logPath, 'apps', appName + '.log'), 
				isManager: isManager,
				standardPort: standardPort,
				allowPorts: [],
				retry: 0,
				state: 'stop'
			};

			if (!err) {
				var configData = JSON.parse(data);

				/* Domain */
				self.applications[id].domain = configData.domain;

				/* Add to dict */
				for (var domain in configData.domain) {
					self.domains[domain] = standardPort;
				}
			}

			self._startApp(id);
		});

	}

	this.run = function(appName) {
		var dirPath = path.join(appPath, appName);
		var appFullpath = path.join(dirPath, 'app.js');

		/* Verify application */
		fs.stat(appFullpath, function(err, stats) {
			if (!stats.isFile())
				return;

			self.startApp(appFullpath);
		});
	};

	this.runAll = function() {

		/* Scanning Applications */
		fs.readdir(appPath, function(err, files) {
			files.forEach(function(file) {
				fs.stat(path.join(appPath, file), function(err, stats) {
					if (stats.isDirectory()) {
						self.run(file);
					}
				});
			});
		});
	};

	this.stopApp = function(id) {
		if (!self.appPriv[id])
			return;

		if (!self.appPriv[id].process)
			return;

		/* Kill application process */
		self.appPriv[id].process.removeAllListeners('exit');
		self.appPriv[id].process.kill('SIGHUP');
		delete self.appPriv[id].process;

		/* update state */
		self.applications[id].state = 'stop';
	};

	this.stopAll = function() {
		for (var id in self.applications) {
			self.stopApp(id);
		}
	};
};
