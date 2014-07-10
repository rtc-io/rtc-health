exports.AS_INT = [
	// Candidate pair
	'bytesReceived', 'bytesSent', 'googRtt', 
	// VideoBwe
	'googActualEncBitrate', 'googAvailableReceiveBandwidth',
	'googAvailableSendBandwidth', 'googBucketDelay',
	'googRetransmitBitrate', 'googTargetEncBitrate',
	'googTransmitBitrate',
	// Ssrc
	'audioInputLevel', 'audioOutputLevel', 'googEchoCancellationEchoDelayMedian', 
	'googEchoCancellationEchoDelayStdDev', 'googEchoCancellationQualityMin',
	'googEchoCancellationReturnLoss', 'googEchoCancellationReturnLossEnhancement',
	'googJitterReceived', 'packetsLost', 'packetsSent', 'packetsReceived',
	'googCurrentDelayMs', 'googDecodeMs', 'googFirsSent', 'googFrameHeightReceived',
	'googFrameRateDecoded', 'googFrameRateOutput', 'googFrameRateReceived',
	'googFrameWidthReceived', 'googJitterBufferMs', 'googMaxDecodeMs', 
	'googMinPlayoutDelayMs', 'googNacksSent', 'googPlisSent', 'googRenderDelayMs', 
	'googTargetDelayMs', 'googExpandRate', 'googJitterBufferMs', 
	'googJitterReceived','googPreferredJitterBufferMs', 'googAvgEncodeMs',
	'googCaptureJitterMs', 'googCaptureQueueDelayMsPerS', 'googEncodeUsagePercent', 
	'googFirsReceived', 'googFrameHeightInput', 'googFrameHeightSent', 
	'googFrameRateInput', 'googFrameRateSent', 'googFrameWidthInput', 
	'googFrameWidthSent', 'googNacksReceived', 'googPlisReceived'
];

exports.AS_COMPARABLE = [
	'bytesSent', 'bytesReceived'
];