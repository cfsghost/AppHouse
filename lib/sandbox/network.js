
module.exports.requestPort = function(AppHouse, preferPort) {
	var port;

	/* Only listen on 80 and ports we allow */
	if (preferPort == AppHouse.standardPort || preferPort == 80 || !preferPort)
		port = AppHouse.standardPort;
	else if (arguments[0] in AppHouse.allowPorts)
		port = arguments[0];
	else if (AppHouse.serverConnections.length == 0)
		port = AppHouse.standardPort;
	else
		throw Error('Cannot listen on port ' + preferPort);

	return port;
};
