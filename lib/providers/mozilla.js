/**
  Mozilla Firefox WebRTC Provider
 **/
var async = require('async');
var StatsReport = require('../statsreport');
var fields = require('../fields');
var util = require('../util');

exports.id = 'mozilla';

/**
  Implementation for Mozilla RTCPeerConnection stats
 **/
exports.getStats = function(pc, opts, callback) {
	// Build a list of tracks
	var tracks = [];
	function addTracks(streams) {
		if (!streams) return;
		for (var i = 0; i < streams.length; i++) {
			var stream = streams[i];
			var sTracks = stream.getTracks();

			for (var tx = 0; tx < sTracks.length; tx++) {
				var track = sTracks[tx];
				if (tracks.indexOf(track) === -1) tracks.push(track);
			}
		}
	}

	addTracks(pc.getLocalStreams());
	addTracks(pc.getRemoteStreams());

	console.log('getStats for');
	console.log(tracks);
	async.mapSeries(
		tracks,
		function(track, done) {
			pc.getStats(track, function(result) {
				if (result) {
					for (var report in result) {
						console.log(report);
						console.log(result[report]);
					}
				}
				return done(null, result);
			}, function(err) { 
				// Error handler maybe?
				return done(err);
			});
		},
		function(err, results) {
			return callback(null, results);
		}
	);
}

/**
  Convert the Mozilla stats objects to a StatsReport
 **/
function convertToStatsReport(report, compare) {
	if (!report) return null;

	var result = new StatsReport({ 
			id: report.id, 
			type: util.standardizeKey(FIELD_PREFIX, report.type),
			subType: (report.type === 'ssrc' ? (report.id.indexOf('send') > 0 ? 'send' : 'receive') : undefined),
			timestamp: report.timestamp
		});
	var names = report.names();

	for (var i = 0; i < names.length; i++) {
		var key = names[i];
		var value = report.stat(FIELD_PREFIX, key);
		var standardKey = util.standardizeKey(key);
		result.set(standardKey, value);
	}
	return result;
}

exports.RTC_PREFIX = 'moz';
var FIELD_PREFIX = exports.FIELD_PREFIX = 'moz';
var fieldMappings = exports.FIELD_MAPPINGS = [];