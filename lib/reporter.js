var uuid = require('uuid');
var fields = require('./fields');
var util = require('./util');


/**
  Generates a statistic report
 **/
function Reporter(opts) {
    if (!opts) return;

    var about = opts.about;

	this.source = opts.source;
	this.target = about.id;
	this.room = about.room;
	this.reports = opts.reports;

    this.status = opts.status || 'unknown';
    if (opts.pc) {
        this.status = util.toStatus(opts.pc.iceConnectionState);
    }
    this.force = opts.force;

	// Create a unique connection id
	this.id = uuid.v4();
    this.connection_id = util.connectionId(this.source, this.target);
}

Reporter.prototype.isActive = function() {
	if (!this.reports) return false;	

	var report = this.getReport('googCandidatePair');
	return report && report.stat('googActiveConnection');
}

/**
  Returns the report of the given type
 **/
Reporter.prototype.getReport = function(reportType) {
	if (!this.reports || this.reports.length === 0) return null;

	for (var i = 0; i < this.reports.length; i++) {
		if (this.reports[i].type === reportType) return this.reports[i];
	}

	return null;
}

/**
  Returns the report with the given id, or null
 **/
Reporter.prototype.getReportById = function(reportId) {
	if (!this.reports || this.reports.length === 0) return null;

	for (var i = 0; i < this.reports.length; i++) {
		if (this.reports[i].id === reportId) return this.reports[i];
	}

	return null;
}

Reporter.prototype.getReportsByType = function(reportType) {
	return ths.getReportsByTypes([reportType]);
}

/**
  Returns all the reports of a given type
 **/
Reporter.prototype.getReportsByTypes = function(reportTypes) {
	if (!this.reports || this.reports.length === 0) return null;

	var result = [];
	for (var i = 0; i < this.reports.length; i++) {
		if (reportTypes.indexOf(this.reports[i].type) >= 0) {
            result.push(this.reports[i]);
        }
	}

	return result;
}

/**
  Returns an array of channel reports, which bundle the statistics for the
  channel, as well as the statistics for the candidate pair
 **/
Reporter.prototype.getChannelReports = function() {

	var candidatePairs = this.getReportsByType('googCandidatePair'),
		reports = [];

	for (var i = 0; i < candidatePairs.length; i++) {
		var cdp = candidatePairs[i],
			channelId = cdp.stat('googChannelId'),
			channelStats = this.getReportById(channelId);

		reports.push(new ChannelReport(channelStats, cdp));
	}
	return reports;
}

/**
  Converts all reports to an object
 **/
Reporter.prototype.toJSON = function(opts) {

	opts = opts || {};

	if (!this.force && !this.reports) return [];

	var result = [],
		now = Date.now(),
		exclude = opts.exclude,
		compareTo = opts.compareTo;

    if (this.reports) {
        for (var i = 0; i < this.reports.length; i++) {     
            var report = this.reports[i];
            if (exclude && exclude.indexOf(report.type) >= 0) continue;

            // If supplied, find a matching report to compare against
            if (compareTo) {
            	for (var ci = 0; ci < compareTo.reports.length; ci++) {
                    var check = compareTo.reports[ci];
                    if (check.id == report.id) {
                    	report.compare(check, {
                            segments: (report.timestamp - check.timestamp) / 1000, // Seconds passed
                            suffix: 'PerSec'
                        });
                    }
                }
            }

            // Add to the output
            result.push(report);
        }
    }

	return { 
		id: this.id, 
		connection: this.connection_id, 
		source: { id: this.source }, 
		target: { id: this.target }, 
		mesh: this.room,
        status: this.status,
		reports: result, 
		timestamp: now 
	};
}

/**
  Creates a channel report for reporting on the entirety of a channel
 **/
function ChannelReport(channel, connection) {
	this.channel = channel;
	this.connection = connection;
}

/**
  Return whether the channel is active
 **/
ChannelReport.prototype.isActive = function() {
	return this.connection && this.connection.stat('googActiveConnection');
}

/**
  Convert the report object to a standardised object for JSON serialization
 **/
ChannelReport.prototype.toJSON = function() {

	var result = { 
			id: (this.channel ? this.channel.id : ''),
			room: this.room,
			active: this.isActive()
		};

	if (this.connection) {
		result.connection = reportToObject(this.connection);
		result.timestamp = (
			this.connection.timestamp ? this.connection.timestamp.getTime() : Date.now()
		);
	}

	return result;
}



module.exports = Reporter;