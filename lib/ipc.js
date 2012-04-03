module.exports = function() {
	var self = this;
	var serial = 0;
	var callbacks = [];

	this.register = function(callback) {
		var id = serial++;

		callbacks[id] = callback;

		return id;
	};

	this.call = function(id, args) {
		if (!callbacks[id])
			return;

		if (!callbacks[id].apply(self, args))
			delete callbacks[id];
	}

	this.delete = function(id) {
		delete callbacks[id];
	};
};
