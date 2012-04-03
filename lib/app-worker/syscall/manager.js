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
};
