var AppHouse = require('./apphouse');
var child_process = require('child_process');
var fs = require('fs');

module.exports = function(path) {
	var self = this;
	var appPath = path || 'apps';

	this.run = function(appName) {
//		if (appName == 'simple-server')
		if (appName == 'express-demo')
			return;

		var appFullpath = appPath + '/' + appName + '/app.js';

		/* Verify application */
		fs.stat(appFullpath, function(err, stats) {
			if (stats.isFile()) {

				/* Create a worker */
				var appProcess = child_process.fork(__dirname + '/app-worker');

				/* Start application */
				appProcess.send({
					type: 'command',
					command: 'start',
					args: [ appFullpath ]
				});
			}
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
