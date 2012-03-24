var config = require('config');
var AppHouse = require('./lib/apphouse.js');

/* Config */
config.path.app = config.path.app || __dirname + '/apps'

/* Initializing Application Manager */
var appMgr = new AppHouse.AppManager(config.path.app);
appMgr.runAll();

/* Initializing Router */
var router = new AppHouse.Router();
router.run();
