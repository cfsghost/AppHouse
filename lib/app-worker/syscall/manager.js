var fs = require('fs');
var path = require('path');

module.exports = function(_process, _ipc) {
	var self = this;
	var workerProcess = _process;
	var ipc = _ipc;

	this.getAppInfo = function(id, callback) {
		var callbackID = ipc.register(callback);

		workerProcess.send({
			type: 'mgrCommand',
			command: 'getappinfo',
			appID: id,
			callback: callbackID
		});
	};

	this.lsApp = function(callback) {
		var callbackID = ipc.register(callback);

		workerProcess.send({
			type: 'mgrCommand',
			command: 'lsapp',
			callback: callbackID
		});
	};

	this.stopApp = function(id, callback) {
		var callbackID = ipc.register(callback);

		workerProcess.send({
			type: 'mgrCommand',
			command: 'stopapp',
			appID: id,
			callback: callbackID
		});
	};

	this.startApp = function(id, callback) {
		var callbackID = ipc.register(callback);

		workerProcess.send({
			type: 'mgrCommand',
			command: 'startapp',
			appID: id,
			callback: callbackID
		});
	};

	this.restartApp = function(id, callback) {
		var callbackID = ipc.register(callback);

		workerProcess.send({
			type: 'mgrCommand',
			command: 'restartapp',
			appID: id,
			callback: callbackID
		});
	};

	this.watchLog = function(id, callback) {
		self.getAppInfo(id, function(app) {
			var startByte = 0;
			var appLogfile = path.join('/.AppHouse_logs', 'apps', path.basename(app.appLogPath));

			fs.stat(appLogfile, function(err, stats){
				if (err)
					throw err;

				/* Get start point */
				startByte = (stats.size >= 2048) ? stats.size - 2048 : 0;
				var fileStream = fs.createReadStream(appLogfile, {
					start: startByte,
					end: stats.size
				})

				/* first to read content */
				fileStream.on('data', function(lines) {
					var startPOS = lines.toString().indexOf('\n') + 1;

					callback(lines.toString().slice(startPOS));

					/* Get last point */
					startByte = stats.size;

					/* Watch log file, we need to read latest messages when it is changed */
					fs.watch(appLogfile, function(event, filename) {
						fs.stat(appLogfile, function(err, stats){
							if (err)
								throw err;

							/* Open log file */
							var fileStream = fs.createReadStream(appLogfile, {
								start: startByte,
								end: stats.size
							})

							/* Read content */
							fileStream.on('data', function(lines) {
								try {
									callback(lines.toString());
								} catch(err) {
									/* Unwatch log file */
									fs.unwatchFile(appLogfile);
								}

								startByte = stats.size;
							});
						});
					});
				});
			});

		});

	};

	this.unwatchLog = function(id) {
		self.getAppInfo(id, function(app) {
			var appLogfile = path.join('/.AppHouse_logs', 'apps', path.basename(app.appLogPath));

			/* Unwatch log file */
			fs.unwatchFile(appLogfile);
		});
	};
};
