var AppHouse = require('../apphouse');
var workerCommand = require('./command');

var sandbox = new AppHouse.Sandbox();
var commander = new workerCommand(sandbox);

/* Initializing */
process.title = 'AppHouse Application';

/* Listen to AppManager */
process.on('message', function(msg) {
	if (msg.type != 'command')
		return;

	commander.command(msg.command, msg.args || []);
});

console.log('Worker is ready.');
