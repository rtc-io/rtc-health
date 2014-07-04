var quickconnect = require('rtc-quickconnect');
var health = require('../');
var crel = require('crel');
var xhr = require('xhr');
var qc = quickconnect('http://rtc.io/switchboard/', { 
			room: 'healthexp',
			sdpfilter: function(sdp) { append(sdp); return sdp; } 
		 });

var monitor = health(qc, { pollInterval: 10000 });

var logger = crel('div');
document.body.appendChild(logger);
function append(msg) {
	crel(logger, crel('p', msg));
}

qc.on('channel:opened', function(id) {
	append('channel opened ' + id);
});

var filter = ['bytesReceived', 'bytesSent'];
var types = ['googComponent', 'googCandidatePair'];

monitor.on('health:changed', function(iceConnectionState, pc) {
	append('iceConnectionState - ' + iceConnectionState);
});

monitor.on('health:closed', function(pc) {
	append('peer left');
});

monitor.on('health:report', function(reporter, pc) {

	var statistics = [];

	console.log(reporter.id);
	console.log(reporter.isActive() ? 'Connection is active' : 'Connection is inactive');

	var channels = reporter.getChannelReports();

	for (var i = 0; i < channels.length; i++) {
		var report = channels[i];
		console.log(report.toJSON());
	}
});

append('started');