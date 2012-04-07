var child_process = require('child_process');
var path = require('path');
var fs = require('fs');
var wrench = require('wrench');

module.exports = function(_runtimepath) {
	var self = this;
	var runtimePath = _runtimepath;

	/* Constructor */
	path.exists(runtimePath, function(exists) {
		if (!exists) {
			fs.mkdirSync(runtimePath);
		}
	});

	this.getRuntimeDir = function(id) {
		return path.join(runtimePath, id.toString());
	};

	this.getAppDir = function(id) {
		return path.join(self.getRuntimeDir(id), 'App');
	};

	this.getDeviceDir = function(id) {
		return path.join(self.getRuntimeDir(id), 'dev');
	};

	this.getLogDir = function(id) {
		return path.join(self.getRuntimeDir(id), 'Logs');
	};

	this.init = function(id, callback) {
		var targetPath = self.getRuntimeDir(id);

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
	};

	this.initApp = function(id, appPath, callback) {
		/* Binding application directory to runtime envionment */
		var mount_process = child_process.spawn('mount', [ '--bind', appPath, self.getAppDir(id) ]);
		mount_process.on('exit', function(code) {
			if (callback)
				callback();
		});
	};

	this.initLog = function(id, LogPath, callback) {
		var link_process = child_process.spawn('ln', [ '-fn', LogPath, path.join(self.getLogDir(id), path.basename(LogPath)) ]);
		link_process.on('exit', function(code) {
			if (callback)
				callback();
		});
	};

	this.release = function(id, callback) {
		var targetPath = self.getRuntimeDir(id);

		/* Unmount App */
		var umount_process = child_process.spawn('umount', [ self.getAppDir(id) ]);
		umount_process.on('exit', function(code) {
			/* Remove runtime directory */
			wrench.rmdirRecursive(targetPath, callback);
		});
	};
};
