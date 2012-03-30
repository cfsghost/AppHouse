var vm = require('vm');
var util = require('util');
var daemon = require('daemon');
var ModuleHandler = require('./module_handler');

module.exports = function() { 
	var self = this;
	this.running = false;
	this.properties = {
		serverConnections: []
	};

	this.run = function(target_path) {
		var sandboxEnv = envInit();

		/* Create a new context for sandbox */
		var context = vm.createContext(sandboxEnv);

		/* Chroot */
		daemon.chroot(target_path);

		/* Run */
		try {
			self.running = true;

			var code = require('fs').readFileSync('/app.js', 'ascii');
			vm.runInNewContext(code, context, '/app.js');
			//vm.runInContext('(function() { require(\'/app.js\'); })();', context, '[AppHouse Hosting Platform]');
		} catch(err) {
			self.running = false;

			console.log(err.stack);
		}
	}

	var envInit = function() {
		var __env = {};

		/* Initializing global object */
		__env.global = __env;
		__env.GLOBAL = __env;
		__env.root = __env;
		__env.__dirname = '/';
		__env.__filename = 'app.js';

		/* TODO: it should be using own implementation to redirect messages for debugging */
		__env.console = console;
		__env.process = process;

		/* Override Module */
		var moduleHandler = new ModuleHandler(self);
		__env.module = moduleHandler.create(__env);
		__env.exports = __env.module.exports;

		/* This is main entry, we do not need to have mainModule */
		delete __env.process.mainModule;

		/* Redirect require */
		__env.require = function(module_path) {
			return __env.module.require(module_path);
		};;
		__env.require.main = __env.process.mainModule;
		__env.require.extensions = require.extensions;

		/* Timers */
		__env.setTimeout = setTimeout;
		__env.clearTimeout = clearTimeout;
		__env.setInterval = setInterval;
		__env.clearInterval = clearInterval;

		/* Buffer */
		__env.Buffer = __env.require('buffer').Buffer;

		/* AppHouse own properties for current process */
		__env.AppHouse = self.properties;

		return __env;
	};
};

