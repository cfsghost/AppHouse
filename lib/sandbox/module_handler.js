
/* Modules for sandbox */
var modules = {
	'http': require('./http'),
	'net': require('./net'),
	'cluster': null
};

module.exports = function(_sandbox) {
	var self = this;
	var sandbox = _sandbox;

	/* Override module API */
	var __module = require('module');
	var __require = __module.prototype.require;

	/* Initializing AppHouse variable */
	for (name in modules) {
		if (modules[name] != null)
			modules[name].AppHouse = sandbox.properties;
	}

	/* Create blank module */
	this.create = function(__env) {
		var _module = new __module(__env.__filename, null);
		_module.filename = __env.__dirname + __env.__filename;
		_module.paths = [ '/node_modules' ];

		return _module;
	};

	this.require = function(module_path) {
		if (module_path == 'module') {
			return __module;
		} else if (module_path in modules) {
			if (modules[module_path])
				return modules[module_path];
			else
				throw Error('Do not support \'cluster\' module.');
		}

		return __require.call(this, module_path);
	};

	/* Override require method */
	__module.prototype.require = self.require;
};
