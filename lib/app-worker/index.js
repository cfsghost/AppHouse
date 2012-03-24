var AppHouse = require('../apphouse');
var workerCommand = require('./command');

var commander = new workerCommand;

/* Initializing */
process.title = 'AppHouse Application';

/* Listen to AppManager */
process.on('message', function(msg) {
	if (msg.type != 'command')
		return;

	commander.command(msg.command, msg.args || []);
});

console.log('Worker is ready.');
