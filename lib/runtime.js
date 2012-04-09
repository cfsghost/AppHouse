var child_process = require('child_process');
var path = require('path');
var fs = require('fs');
var wrench = require('wrench');

function Runtime(_runtimepath) {
	this.runtimePath = _runtimepath;
}
module.exports = Runtime;

Runtime.prototype.getRuntimeDir = function(id) {
	return path.join(this.runtimePath, id.toString());
};

Runtime.prototype.getAppDir = function(id) {
	return path.join(this.getRuntimeDir(id), 'App');
};

Runtime.prototype.getDeviceDir = function(id) {
	return path.join(this.getRuntimeDir(id), 'dev');
};

Runtime.prototype.getLogDir = function(id) {
	return path.join(this.getRuntimeDir(id), 'Logs');
};

Runtime.prototype.init = function(id, callback) {
	var self = this;
	var targetPath = this.getRuntimeDir(id);

	fs.mkdir(this.runtimePath, function() {
		fs.mkdir(targetPath, function() {

			/* Initializing device directory */
			var deviceDir = self.getDeviceDir(id);
			fs.mkdir(deviceDir, function() {
				/* Create random number generator */
				child_process.spawn('mknod', [ '-m', '0444', path.join(deviceDir, 'random'), 'c', 1, 8 ]);
				child_process.spawn('mknod', [ '-m', '0444', path.join(deviceDir, 'urandom'), 'c', 1, 9 ]);

				/* Create Log directory */
				var LogDir = self.getLogDir(id);
				fs.mkdir(LogDir, function() {

					/* Initializing app directory */
					var appDir = self.getAppDir(id);
					fs.mkdir(appDir, function() {
						if (callback)
							callback(targetPath);
					});
				});
			});

		});
	});
};

Runtime.prototype.initApp = function(id, appPath, callback) {
	/* Binding application directory to runtime envionment */
	var mount_process = child_process.spawn('mount', [ '--bind', appPath, this.getAppDir(id) ]);
	mount_process.on('exit', function(code) {
		if (callback)
			callback();
	});
};

Runtime.prototype.initLog = function(id, LogPath, callback) {
	var logDir = this.getLogDir(id);

	/* Try to create file if it doesn't exist */
	fs.open(LogPath, 'a', function(err, fd) {
		fs.close(fd);

		var link_process = child_process.spawn('ln', [ '-fn', LogPath, path.join(logDir, path.basename(LogPath)) ]);
		link_process.on('exit', function(code) {
			if (callback)
				callback();
		});
	});
};

Runtime.prototype.release = function(id, callback) {
	var targetPath = this.getRuntimeDir(id);

	/* Unmount App */
	var umount_process = child_process.spawn('umount', [ this.getAppDir(id) ]);
	umount_process.on('exit', function(code) {
		/* Remove runtime directory */
		wrench.rmdirRecursive(targetPath, callback);
	});
};
