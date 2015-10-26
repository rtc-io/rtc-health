var quickconnect = require('rtc-quickconnect');
var plugins = [require('rtc-plugin-temasys')];
var health = require('../');
var crel = require('crel');
var qc = quickconnect('http://rtc.io/switchboard/', {
			room: 'health-temasys-test',
			sdpfilter: function(sdp) { append(sdp); return sdp; },
			plugins: plugins
		 });

var monitor = health(qc, { pollInterval: 10000 });

var logger = crel('div');
document.body.appendChild(logger);
function append(msg) {
	crel(logger, crel('p', msg));
}

qc.on('channel:opened', function(id, dc) {
	console.log(arguments)
	append('channel opened ' + id);
	dc.onmessage = function(msg) {
		if (msg && msg.data) append(msg.data);
	};

	function ping() {
		console.log('ping');
		dc.send(new Date().toUTCString() + ' - ping');
		setTimeout(ping, 1000);
	}

	if (dc.readyState !== 'open') {
		dc.onopen = ping;
	} else {
		ping();
	}
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

qc.createDataChannel('chat', {ordered: true});

append('started');