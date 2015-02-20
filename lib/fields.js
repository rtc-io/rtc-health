exports.AS_INT = [
	// Candidate pair
	'bytesReceived', 'bytesSent', 'googRtt', 
	// VideoBwe
	'actualEncBitrate', 'availableReceiveBandwidth',
	'availableSendBandwidth', 'bucketDelay',
	'retransmitBitrate', 'targetEncBitrate',
	'transmitBitrate',
	// Ssrc
	'audioInputLevel', 'audioOutputLevel', 'echoCancellationEchoDelayMedian', 
	'echoCancellationEchoDelayStdDev', 'echoCancellationQualityMin',
	'echoCancellationReturnLoss', 'echoCancellationReturnLossEnhancement',
	'jitterReceived', 'packetsLost', 'packetsSent', 'packetsReceived',
	'currentDelayMs', 'decodeMs', 'firsSent', 'frameHeightReceived',
	'frameRateDecoded', 'frameRateOutput', 'frameRateReceived',
	'frameWidthReceived', 'jitterBufferMs', 'maxDecodeMs', 
	'minPlayoutDelayMs', 'nacksSent', 'plisSent', 'renderDelayMs', 
	'targetDelayMs', 'expandRate', 'jitterBufferMs', 
	'jitterReceived','preferredJitterBufferMs', 'avgEncodeMs',
	'captureJitterMs', 'captureQueueDelayMsPerS', 'encodeUsagePercent', 
	'firsReceived', 'frameHeightInput', 'frameHeightSent', 
	'frameRateInput', 'frameRateSent', 'frameWidthInput', 
	'frameWidthSent', 'nacksReceived', 'plisReceived'
];

exports.AS_COMPARABLE = [
	'bytesSent', 'bytesReceived'
];