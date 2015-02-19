/**
  Detects and loads the correct provider for this browser
 **/
var providers = [ require('./providers/chrome'), require('./providers/mozilla') ];

// Check for the existing of the RTCPeerConnection
for (var i = 0; i < providers.length; i++) {
	var pv = providers[i];
	var RTCPeerConnection = window[pv.RTC_PREFIX + 'RTCPeerConnection'];
	if (RTCPeerConnection) {
		module.exports = pv;
		break;
	}
}