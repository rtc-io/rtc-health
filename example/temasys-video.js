var quickconnect = require('rtc-quickconnect');
var captureConfig = require('rtc-captureconfig');
var capture = require('rtc-capture');
var attach = require('rtc-attach');
var health = require('../');
var crel = require('crel');
var plugins = [require('rtc-plugin-temasys')];
var constraints = captureConfig('camera min:1280x720').toConstraints();

function attachVideo(stream, el) {
	attach(stream, {
		el: el,
		plugins: plugins
	}, function(err, el) {
		if (err || !el) return;
		document.body.appendChild(el);
	});
}

capture(constraints, {plugins: plugins}, function(err, stream) {

	attachVideo(stream, crel('div', { class: 'local', style: 'width: 50%;' }));

	var qc = window.qc =
	quickconnect('http://rtc.io/switchboard/', {
		room: 'health-temasys-capture',
		iceServers: [
		  { url: 'stun:stun.l.google.com:19302' }
		],
		disableHeartbeat: true,
		plugins: [require('rtc-plugin-temasys')]
	}).addStream(stream)
	.on('stream:added', function(id, stream) {
		console.log('added %s', id);
		var el = crel('div', { class: 'remote', id: id , style: 'width: 50%;'});
		attachVideo(stream, el);
	})
	.on('stream:removed', function(id) {
		console.log('removed %s', id);
		var el = document.getElementById(id);
		if (el) el.remove();
	})
	.on('local:announce', function(data) {
		console.log('-> connected to %s', data.room);
	})
	.on('peer:announce', function(data) {
		console.log('-> announce');
		console.log(data);
	});

	var monitor = health(qc, { pollInterval: 2500, verbose: true });
	var previous = null;
	monitor.on('health:report', function(reporter) {

		var statistics = [];
		// console.log(reporter.isActive() ? 'Connection is active' : 'Connection is inactive');
		// var channels = reporter.getChannelReports();
		// for (var i = 0; i < channels.length; i++) {
		// 	var report = channels[i];
		// 	console.log(report.toJSON());
		// }
		previous = reporter.toJSON({
			exclude: ['googTrack', 'googComponent', 'googCertificate', 'googLibjingleSession'],
			compareTo: previous
		});
		console.log(previous);
	});

	monitor.on('health:notify', function(evt, opts, data) {
		// console.log('[%s->%s] %s', opts.source, opts.about, evt);
		// if (data) {
		// 	console.log(JSON.stringify(data));
		// }
	});

	monitor.on('health:connection:status', function(conn, status, previousStatus) {
		console.log('Status changed from %s to %s', previousStatus, status);
	});

	window.monitor = monitor;
});