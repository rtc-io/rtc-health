/**
 * The standard provider deals with StatsReport that adhere to the common standard
 */
var bowser = require('bowser');
var StatsReport = require('../statsreport');
var util = require('../util');
var EXCLUDE_FIELDS = ['id', 'type'];
// Don't send reports about the certificate or codec information
var EXCLUDE_TYPES = ['certificate', 'codec'];
var FIELD_PREFIX = '';

/**
  Convert the Chrome RTCStatsReport to a StatsReport
 **/
function convertToStatsReport(report, compare) {
	if (!report || !report.type || EXCLUDE_TYPES.indexOf(report.type) !== -1) return;

	var result = new StatsReport({
        id: report.id,
        type: util.standardizeKey(FIELD_PREFIX, report.type),
        subType: (report.type === 'ssrc' ? (report.id.indexOf('send') > 0 ? 'send' : 'receive') : undefined),
        timestamp: report.timestamp
    });

    Object.keys(report).filter((k) => EXCLUDE_FIELDS.indexOf(k) === -1).map((key) => {
        var standardKey = util.standardizeKey(FIELD_PREFIX, key);
        var value = report[key];        
        result.set(standardKey, value);
    });
	return result;
}

/**
  Standardized WebRTC Stats Report
 **/
exports.id = 'standard';

/**
  
 **/
exports.getStats = function(pc, opts, callback) {
    if (!pc || typeof pc.getStats !== 'function') return callback();
    pc.getStats().then((stats) => {
    	if (!stats) return callback('Could not getStats');
        var reports = [];
        stats.forEach((s) => {
            var report = convertToStatsReport(s);
            if (!report) return;
            reports.push(report);
        });
    	return callback(null, reports);
    }).catch((err) => {
        callback('Could not getStats');
    });
};

/**
  Check if we are using a browser that is supporting the standardized stats reports
 **/
exports.check = function() {
    return bowser && bowser.check({ safari: '12' }, true);
};