var fs = require('fs');
var util = require('util');
var path = require('path');

module.exports = function(_logfile) {
	var self = this;
	var logfile = _logfile || null;
	this.logStream = null;

	if (logfile) {
		/* Create log folder */
		var logdir = path.dirname(logfile);
		if (!path.existsSync(logdir)) {
			fs.mkdirSync(logdir);
		}

		this.logStream = fs.createWriteStream(logfile, { flags: 'a' });
	}

	this.log = function() {
		self.logStream.write(util.format.apply(this, arguments) + '\n');
	};
};
