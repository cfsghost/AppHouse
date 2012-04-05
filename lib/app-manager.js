var AppHouse = require('./apphouse');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var net = require('net');

module.exports = function(_path, _logpath, _tools) {
	var self = this;
	var appPath = _path || 'apps';
	var logPath = _logpath || 'logs';
	var adminTools = _tools || [];
	var workerPath = path.join(__dirname, 'app-worker');
	var serial = 0;

	this.domains = {};
	this.applications = [];
	this.appPriv = [];

	/* Constructor */
	var networkManager = new AppHouse.NetworkManager;
	networkManager.allowPort(10000, 30000);

	/* Methods */
	this.startInstance = function(id, App, Priv, callback) {
		var instance = App.instanceList[id];
		var priv = Priv.instanceList[id];

		/* Start Worker */
		var instProcess = child_process.fork(workerPath);

		priv.process = instProcess;

		instProcess.on('exit', function(code) {
			var delay = 3000;
			instance.state = 'stop';

			/* Delay 30 secs if retry many times already */
			if (instance.retry >= 3) {
				delay = 30000;

				instance.retry = 0;
			} else {
				instance.retry++;
			}

			/* Try to restart */
			setTimeout(function() {
				self.startInstance(id, App, Priv);
			}, delay);
		});

		/* Setup environment */
		instProcess.send({
			type: 'command',
			command: 'set',
			args: [{
				'appID': App.id,
				'standardPort': App.standardPort,
				'allowPorts': App.allowPorts,
				'isManager': App.isManager
			}]
		});

		/* Setup TCP file description */
		instProcess.send({
			type: 'command',
			command: 'setStandardPortHub'
		}, App.standardPortHub);

		instProcess.on('message', function(msg) {
			/* Export APIs for manager */
			if (App.isManager) {
				if (msg.type == 'mgrCommand') {
					switch(msg.command) {
					case 'getappinfo':
						var result = null;

						if (self.applications[msg.appID])
							result = self.applications[msg.appID];

						instProcess.send({
							type: 'callback',
							callback: msg.callback,
							args: [ result ]
						});

						break;

					case 'lsapp':
						instProcess.send({
							type: 'callback',
							callback: msg.callback,
							args: [ self.applications ]
						});
						break;

					case 'stopapp':
						self.stopApp(msg.appID);
						instProcess.send({
							type: 'callback',
							callback: msg.callback,
							args: [ true ]
						});
						break;

					case 'startapp':
						self._startApp(msg.appID, function() {
							instProcess.send({
								type: 'callback',
								callback: msg.callback,
								args: [ true ]
							});
						});
						break;

					case 'restartapp':
						self.stopApp(msg.appID);
						self._startApp(msg.appID, function() {
							instProcess.send({
								type: 'callback',
								callback: msg.callback,
								args: [ true ]
							});
						});
						break;

					}

					return;
				}
			}

			if (msg.type == 'event') {
				switch(msg.name) {
					case 'appStarted':
						instance.state = 'running';

						/* Application was started, call callback function */
						if (callback)
							callback();
						break;
				}
			}
		});

		/* Start application */
		instProcess.send({
			type: 'command',
			command: 'start',
			args: [ App.appPath, App.appLogPath ]
		});
	};

	this.createInstance = function(id, App, Priv) {
		var instance = {
			starttime: new Date().getTime(),
			state: 'stop',
			retry: 0
		};
		var priv = {
			process: null
		};

		App.instanceList.push(instance);
		Priv.instanceList.push(priv);
	};

	this._startApp = function(id, callback) {
		var App = self.applications[id];
		var Priv = self.appPriv[id];

		/* Export Manager API to this App */
		var targetLogPath = path.join(path.dirname(App.appPath), '.AppHouse_logs');

		path.exists(targetLogPath, function(exists) {
			if (exists) {
				child_process.spawn('umount', [ targetLogPath ]);
				fs.unlink(targetLogPath);
			}

			/* Mounting to export log directory if this app is a manager */
			if (App.isManager) {
				path.exists(targetLogPath, function(exists) {
					if (!exists) {
						fs.mkdir(targetLogPath, function() {
							child_process.spawn('mount', [ '--bind', logPath, targetLogPath ]);
						});
					} else {
						child_process.spawn('mount', [ '--bind', logPath, targetLogPath ]);
					}
				});
			}
		});

		/* Timestamp */
		App.starttime = new Date().getTime();

		/* Initializing Port */
		var tcpServer = net.createServer();
		tcpServer.listen(App.standardPort, function() {
			var index = 0;

			App.standardPortHub = tcpServer._handle;

			var sicb = function() {
				index++;

				if (index < App.instanceList.length) {
					self.startInstance(index, App, Priv, sicb);
				} else {

					/* All instances were started */
					tcpServer.close();

					App.state = 'running';

					if (callback)
						callback();
				}
			};

			self.startInstance(index, App, Priv, sicb);
		});

	};

	this.startApp = function(filename) {
		var dirPath = path.dirname(filename);
		var appName = path.basename(dirPath);
		var isManager = false;
		var id = serial++;
		var standardPort = networkManager.requestPort();

		/* This application is a manager, it is able to use APIs to manage service */
		for (var index in adminTools) {
			if (appName == adminTools[index]) {
				isManager = true;
				break;
			}
		}

		/* Reading config */
		fs.readFile(path.join(dirPath, 'apphouse.cfg'), 'utf8', function(err, data) {
			/* Add to list */
			self.appPriv[id] = {
				instanceList: []
			};
			self.applications[id] = {
				id: id,
				appName: appName,
				appPath: filename,
				appLogPath: path.join(logPath, 'apps', appName + '.log'), 
				isManager: isManager,
				standardPort: standardPort,
				allowPorts: [],
				retry: 0,
				state: 'stop',
				instances: 1,
				instanceList: []
			};

			/* Get settings */
			if (!err) {
				var configData = JSON.parse(data);

				/* Domain */
				self.applications[id].domain = configData.domain;

				/* Add to dict */
				for (var domain in configData.domain) {
					self.domains[domain] = standardPort;
				}

				/* Number of instance */
				if ('instances' in configData) {
					self.applications[id].instances = configData.instances;
				}
			}

			/* Create Instances */
			for (var i = 0; i < self.applications[id].instances; i++) {
				self.createInstance(i, self.applications[id], self.appPriv[id]);
			}

			self._startApp(id);
		});

	}

	this.run = function(appName) {
		var dirPath = path.join(appPath, appName);
		var appFullpath = path.join(dirPath, 'app.js');

		/* Verify application */
		fs.stat(appFullpath, function(err, stats) {
			if (!stats.isFile())
				return;

			self.startApp(appFullpath);
		});
	};

	this.runAll = function() {

		/* Scanning Applications */
		fs.readdir(appPath, function(err, files) {
			files.forEach(function(file) {
				fs.stat(path.join(appPath, file), function(err, stats) {
					if (stats.isDirectory()) {
						self.run(file);
					}
				});
			});
		});
	};

	this.stopInstance = function(id, App, Priv) {
		var instance = App.instanceList[id];
		var priv = Priv.instanceList[id];

		/* Kill application process */
		priv.process.removeAllListeners('exit');
		priv.process.kill('SIGHUP');
		priv.process = null;

		/* update state */
		instance.state = 'stop';
	};

	this.stopApp = function(id) {
		if (!self.applications[id])
			return;

		if (!self.appPriv[id])
			return;

		for (var index in self.applications[id].instanceList) {
			self.stopInstance(index, self.applications[id], self.appPriv[id]);
		}

		/* update state */
		self.applications[id].state = 'stop';
	};

	this.stopAll = function() {
		for (var id in self.applications) {
			self.stopApp(id);
		}
	};
};
