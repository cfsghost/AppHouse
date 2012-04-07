var fs = require('fs');
var util = require('util');
var path = require('path');

module.exports = function(_logfile) {
	var self = this;
	var logfile = _logfile || null;
	this.logStream = null;

	var createStream = function(callback) {
		self.logStream = fs.createWriteStream(logfile, { flags: 'a' });
		self.logStream.on('open', function() {
			callback();
		});
	};

	this.init = function(callback) {
		if (logfile) {
			var logdir = path.dirname(logfile);

			/* Create log folder */
			path.exists(logdir, function(exists) {
				if (!exists)
					fs.mkdir(logdir, function() {
						createStream(callback);
					});
				else
					createStream(callback);
			});
		}
	};

	this.log = function() {
		self.logStream.write(util.format.apply(this, arguments) + '\n');
	};
};
