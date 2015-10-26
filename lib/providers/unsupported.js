/**
  Unsupported provider
 **/
exports.id = 'unsupported';

/**
  Implementation for Mozilla RTCPeerConnection stats
 **/
exports.getStats = function(pc, opts, callback) {
	return callback(null, []);
}

/**
  Unsupported supports all
 **/
exports.check = function() {
	return true;
}