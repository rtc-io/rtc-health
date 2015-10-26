/**
  Detects and loads the correct provider for this browser
 **/
var providers = [
	require('./providers/google'),
	require('./providers/mozilla'),
	require('./providers/temasys'),
	require('./providers/unsupported'),
];

module.exports = function() {
	var detected = null;

	// Check for the existing of the RTCPeerConnection
	for (var i = 0; i < providers.length; i++) {
		var pv = providers[i];
		var RTCPeerConnection = window[(pv.RTC_PREFIX || '') + 'RTCPeerConnection'];
		if (RTCPeerConnection || (pv.check && pv.check())) {
			detected = pv;
			break;
		}
	}

	return detected;
};