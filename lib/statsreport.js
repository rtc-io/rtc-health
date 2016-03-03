var fields = require('./fields');

var CATEGORIES = {
	'audioInputLevel': 'audio.input',
	'audioOutputLevel': 'audio.output',
	'frameWidthInput': 'video.input',
	'frameWidthReceived': 'video.output',
	'actualEncBitrate': 'video.capture',
	'rtt': 'candidate_pair'
};

/**
  StatsReport is standardised way of holding RTCStats reports regardless of the browser
  implementation
 **/
function StatsReport(opts) {
	opts = opts || {};

	// Details
	this.id = opts.id;
	this.type = opts.type;
	this.category = opts.category;
	if (opts.subType) {
		this.subtype = opts.subType;
	}

	// Timestamp
	var time = opts.timestamp || new Date();
	this.timestamp = (time instanceof Date ? time.getTime() : time);

	this.data = {};
}

/**
  Sets the value of the stats report value, performing appropriate data checks along the way
 **/
StatsReport.prototype.set = function(key, value) {

	if (fields.AS_INT.indexOf(key) >= 0) {
		var parsedValue = parseInt(value);
		this.data[key] = (parsedValue !== NaN ? parsedValue : value);
	} else {
		this.data[key] = value;
	}

	// Automatically set report category
	if (CATEGORIES[key]) this.category = CATEGORIES[key];
}

/**
  Compares the comparable fields in each StatsReport, and generates new fields
  based on the results
 **/
StatsReport.prototype.compare = function(other, compareOpts) {
	if (!compareOpts) return;
	// Iterate over the fields
	for (var key in this.data) {
		if (fields.AS_COMPARABLE.indexOf(key) >= 0) {
			var value = this.data[key];
			this.set(key + compareOpts.suffix, Math.round((value - other.data[key]) / compareOpts.segments));
		}
	}
	return;
}

module.exports = StatsReport;