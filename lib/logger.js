var fs = require('fs');
var util = require('util');
var path = require('path');

module.exports = function(_logfile) {
	var self = this;
	var logfile = _logfile || null;
	this.logStream = null;

	this.init = function(callback) {
		if (logfile) {
			var logdir = path.dirname(logfile);

			/* Create log folder */
			if (!path.existsSync(logdir)) {
				fs.mkdirSync(logdir);
			}

			try {
				self.logStream = fs.createWriteStream(logfile, { flags: 'a' });
			} catch(err) {
				if (callback)
					callback(err);

				return;
			}
		}

		if (callback)
			callback();
	};

	this.log = function() {
		self.logStream.write(util.format.apply(this, arguments) + '\n');
	};
};
