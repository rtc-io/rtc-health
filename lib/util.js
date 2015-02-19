var humps = require('humps');

var STATUS_CONNECTING = 'connecting',
	STATUS_CONNECTED = 'connected',
	STATUS_DISCONNECTED = 'disconnected',
	STATUS_ERROR = 'error',
	STATUS_CLOSED = 'closed',
	STATUS_UNKNOWN = 'unknown';

var statusMappings = {
		'new': STATUS_CONNECTING,
		'checking': STATUS_CONNECTING,
		'connected': STATUS_CONNECTING,
		'completed': STATUS_CONNECTED,
		'failed': STATUS_ERROR,
		'disconnected': STATUS_DISCONNECTED,
		'closed': STATUS_CLOSED
	};

exports.connectionId = function(source, target) {
	return (source < target 
			? source + ':' + target 
			: target + ':' + source);
}

exports.toStatus = function(iceConnectionState) {
	if (!iceConnectionState) return STATUS_UNKNOWN;

	var status = statusMappings[iceConnectionState.toLowerCase()];
	return status || STATUS_UNKNOWN;
}

exports.standardizeKey = function(prefix, key) {
	if (!key) return key;
	var normalized = key;
	if (key.indexOf(prefix) === 0) {
		normalized = key.replace(prefix, '');
	}
	return humps.camelize(normalized);
}

exports.SIGNALLER_EVENTS = ['init', 'open', 'connected', 'disconnected', 'error'];