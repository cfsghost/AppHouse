module.exports = function(_process, _ipc) {
	var self = this;
	var workerProcess = _process;
	var ipc = _ipc;

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
};
