var StatsReport = require('../statsreport');
var fields = require('../fields');
var util = require('../util');

/**
  Google Chrome WebRTC Provider
 **/
exports.id = 'chrome';

/**
  Gets the RTCStats for a given RTCPeerConnection
 **/
exports.getStats = function(pc, opts, callback) {
    pc.getStats(function(stats) {
    	if (!stats) return callback('Could not getStats');
    	var result = stats.result();
    	var reports = [];
    	for (var i = 0; i < result.length; i++) {
    		reports.push(convertToStatsReport(result[i]));
    	}
    	return callback(null, reports);
    });
}

/**
  Convert the Chrome RTCStatsReport to a StatsReport
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
		var value = report.stat(key);
		var standardKey = util.standardizeKey(FIELD_PREFIX, key);
		result.set(standardKey, value);
	}
	return result;
}

exports.RTC_PREFIX = 'webkit';
var FIELD_PREFIX = exports.FIELD_PREFIX = 'goog';
var fieldMappings = exports.FIELD_MAPPINGS = [];