var httpProxy = require('http-proxy');

module.exports = function(_appMgr) {
	var self = this;
	var appMgr = _appMgr;

	this.run = function() {
		/* Create Server */
		httpProxy.createServer(function(req, res, proxy) {
			var targetPort = appMgr.domains[req.headers.host];
			if (!targetPort) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.end('No such application!');
				return;
			}

			proxy.proxyRequest(req, res, {
				host: 'localhost',
				port: appMgr[req.headers.host]
			});
		}).listen(8000);
	};
};
