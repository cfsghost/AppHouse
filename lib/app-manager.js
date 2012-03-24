var AppHouse = require('./apphouse');
var child_process = require('child_process');
var fs = require('fs');

module.exports = function(path) {
	var self = this;
	var appPath = path || 'apps';
	var workerPath = __dirname + '/app-worker';
	var serial = 0;
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

		/* Start application */
		appProcess.send({
			type: 'command',
			command: 'start',
			args: [ filename ]
		});
	};

	this.startApp = function(filename) {
		var id = serial++;

		/* Add to list */
		self.applications[id] = {
			process: null,
			retry: 0
		};

		self._startApp(id, filename);
	}

	this.run = function(appName) {
		var appFullpath = appPath + '/' + appName + '/app.js';

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
				fs.stat(appPath + '/' + file, function(err, stats) {
					if (stats.isDirectory()) {
						self.run(file);
					}
				});
			});
		});
	};
};
