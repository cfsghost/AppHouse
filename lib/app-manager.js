var AppHouse = require('./apphouse');
var fs = require('fs');

module.exports = function(path) {
	var self = this;
	var appPath = path || 'apps';

	this.run = function(appName) {
		if (appName == 'express-demo')
			return;

		var appFullpath = appPath + '/' + appName + '/app.js';

		/* Confirm it is a application */
		fs.stat(appFullpath, function(err, stats) {
			if (stats.isFile()) {
				code = fs.readFileSync(appPath + '/' + appName + '/app.js', 'ascii');

				/* Run application in sandbox */
				AppHouse.Sandbox(code, appPath + '/' + appName, 'app.js');
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
