module.exports = function() {
	var self = this;
	var startPort;
	var endPort;
	var registeredPorts = {};

	this.allowPort = function(start, end) {
		if (!start || !end)
			return;

		if (start > end)
			return;

		/* Reset */
		startPort = start;
		endPort = end;
	};

	this.registerPort = function(port) {
		registeredPorts[port] = true;
	};

	this.requestPort = function() {
		for (var i = startPort; i <= endPort; i++) {
			if (!(i in registeredPorts)) {
				self.registerPort(i);
				return i;
			}

			if (!registeredPorts[i]) {
				self.registerPort(i);
				return i;
			}
		}

		throw Error('No port can be requested');
	};
};
