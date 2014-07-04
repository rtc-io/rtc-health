var quickconnect = require('rtc-quickconnect');
var captureConfig = require('rtc-captureconfig');
var media = require('rtc-media');
var health = require('../');
var crel = require('crel');
var xhr = require('xhr');


// capture local media
var localMedia = media({
	constraints: captureConfig('camera min:1280x720').toConstraints()
});

var local = crel('div', { class: 'local' });
document.body.appendChild(local);
localMedia.render(local);

localMedia.once('capture', function(stream) {

	var qc = quickconnect('http://rtc.io/switchboard/', { 
				room: 'health-capture',
				iceServers: [
				  { url: 'stun:stun.l.google.com:19302' }
				],
			    disableHeartbeat: true
			 }).broadcast(stream);

	var monitor = health(qc, { pollInterval: 10000 });
	monitor.on('health:report', function(reporter) {

		var statistics = [];
		console.log(reporter.isActive() ? 'Connection is active' : 'Connection is inactive');
		// var channels = reporter.getChannelReports();
		// for (var i = 0; i < channels.length; i++) {
		// 	var report = channels[i];
		// 	console.log(report.toJSON());
		// }
		console.log(reporter.toJSON(['googTrack', 'googComponent', 'googCertificate', 'googLibjingleSession']));
	});
});