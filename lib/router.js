var http = require('http');

module.exports = function() {
	var self = this;

	this.run = function() {
		/* Start */
		http.createServer(function (req, res) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end('AppHouse Hosting Platform\n');
		}).listen(8000);
	}
};
