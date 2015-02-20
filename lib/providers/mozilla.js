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

	var reports = [];
	async.eachSeries(
		tracks,
		function(track, done) {
			pc.getStats(track, function(result) {
				if (result) {
					var converted = convertToStatsReport(result);
					if (converted) reports = reports.concat(converted);
				}				
				return done(null, result);
			}, function(err) { 
				// Error handler maybe?
				return done(err);
			});
		},
		function(err) {
			return callback(null, reports);
		}
	);
}

/**
  Convert the Mozilla stats objects to a StatsReport so the data is reported in the same fashion
  as Chrome
 **/
function convertToStatsReport(report, compare) {
	if (!report) return null;

	function getReportsOfType(type) {
		if (!report || report.length === 0) return null;
		var matching = [];
		report.forEach(function(rp) {
			if (rp.type == type) matching.push(rp);
		});
		return (matching.length === 1 ? matching[0] : (matching.length === 0 ? null : matching));
	}

	var cp = getReportsOfType('candidatepair');
	// If no candidate pair information, then return
	if (!cp || !cp.id) return null;
	var derived = [];
	var lc = report.get(cp.localCandidateId);
	var rc = report.get(cp.remoteCandidateId);
	var outbound = getReportsOfType('outboundrtp');
	var inbound = getReportsOfType('inboundrtp');

	// Create a candidate pair report
	var candidatePair = new StatsReport({
		id: cp.id,
		type: 'candidatePair',
		timestamp: new Date(cp.timestamp).getTime()
	});
	candidatePair.set('activeConnection', cp.state === 'succeeded');
	candidatePair.set('channelId', cp.componentId);	
	if (inbound) {
		candidatePair.set('bytesReceived', inbound.bytesReceived);	
		candidatePair.set('rtt', inbound.mozRtt);
	}
	if (outbound) {
		candidatePair.set('bytesSent', outbound.bytesSent);
	}
	if (lc) {
		candidatePair.set('localAddress', lc.ipAddress + ':' + lc.portNumber);	
	}
	if (rc) {
		candidatePair.set('transportType', rc.transport);
	}	
	derived.push(candidatePair);

	// Create the ssrc send report
	if (outbound && outbound) {
		var ssrcSend = new StatsReport({
			id: 'ssrc_' + outbound.ssrc + '_send',
			type: 'ssrc',
			subtype: 'send',
			timestamp:  new Date(outbound.timestamp).getTime()
		});
		ssrcSend.set('bytesSent', outbound.bytesSent);
		ssrcSend.set('packetsSent', outbound.packetsSent);
		derived.push(ssrcSend);
	}

	// Create the ssrc inbound report
	if (inbound) {
		var ssrcReceive = new StatsReport({
			id: 'ssrc_' + inbound.ssrc + '_receive',
			type: 'ssrc',
			subtype: 'receive',
			timestamp:  new Date(inbound.timestamp).getTime()
		});
		ssrcReceive.set('bytesReceived', inbound.bytesReceived);
		ssrcReceive.set('packetsReceived', inbound.packetsReceived);
		ssrcReceive.set('packetsLost', inbound.packetsLost);
		ssrcReceive.set('jitterReceived', inbound.jitter);
		derived.push(ssrcReceive);
	}

	return derived;
}

exports.RTC_PREFIX = 'moz';
var FIELD_PREFIX = exports.FIELD_PREFIX = 'moz';
var fieldMappings = exports.FIELD_MAPPINGS = [];