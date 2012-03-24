var vm = require('vm');
var daemon = require('daemon');

var supportModules = [
	'util',
	'events',
	'path',
	'crypto',
	'dns',
	'url',
	'zlib',
	'assert'
];

module.exports = function(code, target_path) {
	var sandboxEnv = envInit();

	/* Create a new context for sandbox */
	var context = vm.createContext(sandboxEnv);

	/* Chroot */
	daemon.chroot(target_path);

	/* Run */
	var script = vm.createScript(code);
	script.runInNewContext(context);
};

function envInit(dirname, filename) {
	var __env = {};

	/* Initializing global object */
	__env.global = __env;
	__env.__dirname = '/';
	__env.__filename = 'app.js';

	/* TODO: it should be using own implementation to redirect messages for debugging */
	__env.console = console;
	__env.process = process;


	/* Module */
	var __module = require('module');
	__env.module = new __module(__env.__dirname + __env.__filename, null);
	__env.process.mainModule = __env.module;
	__env.require = __env.module.require;

	/* Buffer */
	__env.Buffer = __env.require('buffer');
/*
	__env.require = function(module_name) {
		if (module_name in supportModules) {
			return require(module_name);
		} else {
			throw 'Error: Cannot find module \'' + module_name + '\'';
		}
	};
*/
	/* Timers */
	__env.setTimeout = setTimeout;
	__env.clearTimeout = clearTimeout;
	__env.setInterval = setInterval;
	__env.clearInterval = clearInterval;

	return __env;
}
