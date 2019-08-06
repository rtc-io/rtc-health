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
    return new Promise((resolve, reject) => {
        if (!pc || typeof pc.getStats !== 'function') return resolve();
        // Handle stats requests hanging on Firefox if the connection is closing
        let timer = setTimeout(() => reject('Timed out'), 1000);
        pc.getStats().then((stats) => {
            clearTimeout(timer);
            if (!stats) return callback('Could not getStats');
            var reports = [];
            stats.forEach((s) => {
                var report = convertToStatsReport(s);
                if (!report) return;
                reports.push(report);
            });            
            return resolve(reports);
        })
    })
    .then((data) => callback(null, data))
    .catch((err) => {
        callback('Could not getStats');
    });
};

/**
  Check if we are using a browser that is supporting the standardized stats reports
 **/
exports.check = function() {
    return bowser && bowser.check({ safari: '12' }, true);
};