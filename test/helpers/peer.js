var quickconnect = require('rtc-quickconnect');
var signaller = require('./signaller');
var health = require('../..');

exports.peerCreator = function(signallingServer, opts) {
	opts = opts || {};
	return function(t, callback) {
	    t.test('create a new peer', function(t) {
	    	console.log('create peer');
	        t.plan(3);
	        var sig = signaller(require('rtc-switchboard-messenger')(signallingServer));
	        sig.once('connected', function() {
		        t.pass('signaller connected');
	        });
	        var connection = quickconnect(sig, opts);
	        t.ok(connection, 'new quickconnect created');
	        var monitor = health(connection, opts.monitorOpts || { pollInterval: 10000 });
	        t.ok(monitor, 'monitor attached');
	        return callback(null, { connection: connection, monitor: monitor } );
	    });
	};
}