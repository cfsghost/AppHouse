var AppHouse = require('./apphouse');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

module.exports = function(_path) {
	var self = this;
	var appPath = _path || 'apps';
	var workerPath = path.join(__dirname, 'app-worker');
	var serial = 0;

	this.domains = {};
	this.applications = [];

	this._startApp = function(id, filename) {
		var App = self.applications[id];

		/* Start Worker */
		var appProcess = child_process.fork(workerPath);

		App.starttime = new Date().getTime()
		App.process = appProcess;

		appProcess.on('exit', function(code) {
			var delay = 3000;

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
				'allowPorts': App.allowPorts
			}]
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
		var id = serial++;
		var standardPort = 10000 + id;

		/* Reading config */
		fs.readFile(path.join(dirPath, 'apphouse.cfg'), 'utf8', function(err, data) {
			/* Add to list */
			self.applications[id] = {
				process: null,
				standardPort: standardPort,
				allowPorts: [],
				retry: 0
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
		if (!self.applications[id])
			return;

		if (!self.applications[id].process)
			return;

		/* Kill application process */
		self.applications[id].process.kill('SIGHUP');
		delete self.applications[id].process;
	};

	this.stopAll = function() {
		for (var id in self.applications) {
			self.stopApp(id);
		}
	};
};
