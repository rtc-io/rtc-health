var STATUS_CONNECTING = 'connecting',
	STATUS_CONNECTED = 'connected',
	STATUS_DISCONNECTED = 'disconnected',
	STATUS_CLOSED = 'closed',
	STATUS_UNKNOWN = 'unknown';

var statusMappings = {
		'new': STATUS_CONNECTING,
		'checking': STATUS_CONNECTING,
		'connected': STATUS_CONNECTING,
		'completed': STATUS_CONNECTED,
		'failed': STATUS_DISCONNECTED,
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