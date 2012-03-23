var vm = require('vm');

var supportModules = [
	'util',
	'events'
];

module.exports = function(code, dirname, filename) {
	var sandboxEnv = envInit(dirname, filename);

	/* Create a new context for sandbox */
	var context = vm.createContext(sandboxEnv);

	/* Run */
	var script = vm.createScript(code);
	script.runInNewContext(context);
};

function envInit(dirname, filename) {
	var __env = {};

	__env.global = __env;
//	__env.__dirname = './';
//	__env.__filename = filename;

	/* TODO: it should be using own implementation to redirect messages for debugging */
	__env.console = console;
//	__env.require = require;

	__env.require = function(module_name) {
		if (module_name in supportModules) {
			return require(module_name);
		} else {
			throw 'Error: Cannot find module \'' + module_name + '\'';
		}
	};

	/* Timers */
	__env.setTimeout = setTimeout;
	__env.clearTimeout = clearTimeout;
	__env.setInterval = setInterval;
	__env.clearInterval = clearInterval;

	return __env;
}
