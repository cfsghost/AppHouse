var config = require('config');
var AppHouse = require('./lib/apphouse.js');
var path = require('path');
var fs = require('fs');

/* Config */
config.path.app = config.path.app || path.join(__dirname, 'apps');
config.path.log = config.path.log || path.join(__dirname, 'logs');
config.path.runtime = config.path.runtime || path.join(__dirname, 'runtime');

/* Initializing */
var appMgr;
var router;

/* Initializing log directory */
fs.mkdir(config.path.log, function() {
	fs.mkdir(path.join(config.path.log, 'apps'), function() {

		/* Initializing Application Manager */
		appMgr = new AppHouse.AppManager(config.path.app, config.path.log, config.path.runtime, config.admin.tools);
		appMgr.runAll();

		/* Initializing Router */
		router = new AppHouse.Router(appMgr);
		router.run();
	});
});

process.on('uncaughtException', function(err) {
	console.err(err.stack);

	/* Stop all application */
	appMgr.stopAll(function() {
		process.exit(1);
	});
});

process.on('SIGHUP', function() {
	/* Stop all application */
	appMgr.stopAll(function() {
		process.exit(1);
	});
})

process.on('SIGINT', function() {
	/* Stop all application */
	appMgr.stopAll(function() {
		process.exit(1);
	});
});
