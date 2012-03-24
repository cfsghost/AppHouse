var AppHouse = require('../apphouse');
var workerCommand = require('./command');

var commander = new workerCommand;

/* Listen to AppManager */
process.on('message', function(msg) {
	if (msg.type != 'command')
		return;

	commander.command(msg.command, msg.args);
});

console.log('Worker is ready.');