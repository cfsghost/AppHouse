var AppHouse = require('./apphouse');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

module.exports = function(_path, _tools) {
	var self = this;
	var appPath = _path || 'apps';
	var adminTools = _tools || [];
	var workerPath = path.join(__dirname, 'app-worker');
	var serial = 0;

	this.domains = {};
	this.applications = [];
	this.appPriv = [];

	this._startApp = function(id, filename) {
		var App = self.applications[id];
		var Priv = self.appPriv[id];

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
				self._startApp(id, filename);
			}, delay);
		});

		/* Setup environment */
		appProcess.send({
			type: 'command',
			command: 'set',
			args: [{
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
					case 'lsapp':
						appProcess.send({
							type: 'callback',
							callback: msg.callback,
							args: [ self.applications ]

						});
						break;
					}

					return;
				}
			}

			console.log(msg);

			if (msg.type == 'command') {
				switch(msg.command) {
					case 'setState':
						App.state = msg.state;
						break;
				}
			}
		});

		/* Start application */
		appProcess.send({
			type: 'command',
			command: 'start',
			args: [ filename ]
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

			self._startApp(id, filename);
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
		self.appPriv[id].process.kill('SIGHUP');
		delete self.appPriv[id].process;
	};

	this.stopAll = function() {
		for (var id in self.applications) {
			self.stopApp(id);
		}
	};
};
