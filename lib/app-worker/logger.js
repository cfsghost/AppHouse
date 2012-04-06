var AppHouse = require('../apphouse');

module.exports = function(_logger, LogPath, callback) {
	var logger = null;

	if (!_logger) {
		logger = new AppHouse.Logger(LogPath);
		logger.init(function(err) {
			if (callback)
				callback(err, logger);
		});

		return;
	}

	if (callback)
		callback(null, _logger);
};
