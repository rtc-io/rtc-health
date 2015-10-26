var google = require('./google');

/**
  Temasys WebRTC Provider
 **/
exports.id = 'temasys';

/**
  Temasys uses Chrome style stats
 **/
exports.getStats = function(pc, opts, callback) {
	if (pc.iceConnectionState !== 'connected') return callback();
	return google.getStats.apply(null, arguments);
};

/**
  Check if Temasys is handling this connection
 **/
exports.check = function() {
	return document &&
		document.body &&
		document.body.querySelectorAll &&
		document.body.querySelectorAll('[type="application/x-temwebrtcplugin"]').length > 0;
};