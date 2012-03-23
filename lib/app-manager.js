var fs = require('fs');

module.exports = function(path) {
	var self = this;
	var appPath = path || 'apps';

	this.run = function(appName) {
		/* TODO: Run Application */
		console.log(appName);
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
