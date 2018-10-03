var quickconnect = require('rtc-quickconnect');
var captureConfig = require('rtc-captureconfig');
var media = require('rtc-media');
var health = require('../');
var crel = require('crel');
var alerter = require('../alerts');
var threshold = require('../alerts/threshold');

// capture local media
var localMedia = media({
	constraints: captureConfig('camera min:1280x720').toConstraints()
});

var local = crel('div', { class: 'local', style: 'width: 50%;' });
document.body.appendChild(local);
localMedia.render(local);

localMedia.once('capture', function(stream) {

	var qc = window.qc =
	quickconnect('http://localhost:3000/', {
		room: 'health-capture',
		iceServers: [
		  { url: 'stun:stun.l.google.com:19302' }
		],
		disableHeartbeat: true
	}).addStream(stream)
	.on('stream:added', function(id, stream) {
		console.log('added %s', id);
		var el = crel('div', { class: 'remote', id: id , style: 'width: 50%;'});
		document.body.appendChild(el);
		media(stream).render(el);
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
	var alerts = alerter(monitor);
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

	var lowSendBandwidth = threshold('videoBwe', 'availableSendBandwidth', {
		threshold: 1e6,  // Mbit/s
		period: 10*1000 // ms
	});

	// Calling addAlert by default will monitor for this alert on _all_ peer connections.
	alerts.addAlert('warning:bandwidth', lowSendBandwidth);

	// Listen for the named event to receive updates:
	alerts.on('warning:bandwidth', function(data) {
		// Fires whenever the minimum of the available bandwidth among all peers crosses
		// 1Mbps for 10 seconds or more.
		console.log('there is', data.low ? 'a' : 'no', 'bandwidth problem');
		console.log(data);
	});

	window.monitor = monitor;
});