var quickconnect = require('rtc-quickconnect');
var health = require('..');

exports.peerCreator = function(signallingServer, opts) {
	opts = opts || {};
	return function(t, callback) {
	    t.test('create a new peer', function(t) {
	        t.plan(2);
	        var connection = quickconnect(signallingServer, opts);
	        t.ok(connection, 'new quickconnect created');
	        var monitor = health(connection, opts.monitorOpts || { pollInterval: 10000 });
	        t.ok(monitor, 'monitor attached');
	        return callback(null, { connection: connection, monitor: monitor } );  
	    });
	};
}