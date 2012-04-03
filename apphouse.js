var config = require('config');
var AppHouse = require('./lib/apphouse.js');
var path = require('path');

/* Config */
config.path.app = config.path.app || path.join(__dirname, 'apps');

/* Initializing Application Manager */
var appMgr = new AppHouse.AppManager(config.path.app, config.admin.tools);
appMgr.runAll();

/* Initializing Router */
var router = new AppHouse.Router(appMgr);
router.run();

process.on('uncaughtException', function(err) {
	console.err(err.stack);

	/* Stop all application */
	appMgr.stopAll();

	process.exit(1);
});
