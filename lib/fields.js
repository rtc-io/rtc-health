exports.AS_INT = [
	// Candidate pair
	'bytesReceived', 'bytesSent', 'rtt', 
	// VideoBwe
	'actualEncBitrate', 'availableReceiveBandwidth',
	'availableSendBandwidth', 'bucketDelay',
	'retransmitBitrate', 'targetEncBitrate',
	'transmitBitrate',
	// Ssrc
	'audioInputLevel', 'audioOutputLevel', 'captureStartNtpTimeMs',
	'echoCancellationEchoDelayMedian', 
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
	'frameWidthSent', 'nacksReceived', 'plisReceived',

	'decodingCNG', 'decodingCTN', 'decodingCTSG', 'decodingNormal', 
	'decodingPLC', 'decodingPLCCNG'
];

exports.AS_COMPARABLE = [
	'bytesSent', 'bytesReceived'
];