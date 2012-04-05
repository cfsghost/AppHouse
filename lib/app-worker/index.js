var AppHouse = require('../apphouse');
var workerCommand = require('./command');

var ipc = new AppHouse.IPC();
var sandbox = new AppHouse.Sandbox();
var commander = new workerCommand(sandbox, ipc);

/* Initializing */
process.title = 'AppHouse Application';

/* Listen to AppManager */
process.on('message', function(msg, handle) {
	switch(msg.type) {
	case 'command':
		commander.command(msg.command, msg.args || (handle ? [ handle ] : []));
		break;

	case 'callback':
		ipc.call(msg.callback, msg.args);
		break;
	}
});

console.log('Worker is ready.');
