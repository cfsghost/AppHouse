var vm = require('vm');
var util = require('util');
var daemon = require('daemon');

/* Modules for sandbox */
var _module_http = require('./http');
var _module_net = require('./net');

module.exports = function(target_path) {
	var sandboxEnv = envInit();

	/* Create a new context for sandbox */
	var context = vm.createContext(sandboxEnv);

	/* Chroot */
	daemon.chroot(target_path);

	/* Run */
	try {
		var code = require('fs').readFileSync('/app.js', 'ascii');
		vm.runInNewContext(code, context, '/app.js');
		//vm.runInContext('(function() { require(\'/app.js\'); })();', context, '[AppHouse Hosting Platform]');
	} catch(err) {
		console.log(err.stack);
	}
};

function envInit() {
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
	var __module = require('module');

	__env.module = new __module(__env.__filename, null);
	__env.module.filename = __env.__dirname + __env.__filename;
	__env.module.paths = [ '/node_modules' ];
	__env.exports = __env.module.exports;

	/* This is main entry, we do not need to have mainModule */
	delete __env.process.mainModule;

	/* require method */
	var __require = __module.prototype.require;
	__module.prototype.require = function(module_path) {
		if (module_path == 'cluster') {
			throw Error('Do not support \'cluster\' module.');
		} else if (module_path == 'http') {
			return _module_http;
		} else if (module_path == 'net') {
			return _module_net;
		}

		return __require.call(this, module_path);
	};

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

	return __env;
}
