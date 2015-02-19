# rtc-health


### Standardisation of reports

Currently, Chrome and Firefox do not implementation the WebRTC.getStats API method the same way.

#### Candidate Pair

_Chrome_
Contains LocalCandidate and Remote candidate for a particular channel within a single report of type ```candidatePair```
```
activeConnection: "true"bytesReceived: 511448bytesReceivedPerSec: 3207bytesSent: 799234bytesSentPerSec: 5198channelId: "Channel-audio-1"localAddress: "192.168.1.10:59067"localCandidateType: "local"readable: "true"remoteAddress: "192.168.1.10:54914"remoteCandidateType: "local"rtt: "1"transportType: "udp"writable: "true"
```

_Firefox_
The data for an equivalent candidate pair report is found by querying getStats for the given stream, then combining the following:

- Candidate Pair
```
{ id: "2dtX", timestamp: 1424334373346.029, type: "candidatepair", componentId: "1424334323058674 (id=93 url=http://127.0.0.1:9968/): stream1/audio", localCandidateId: "cV3N", mozPriority: 7962116751040578000, nominated: true, remoteCandidateId: "CiEB", selected: true, state: "succeeded" }
```

- Local Candidates 
There may be more than one of these
```
{ id: "cV3N", timestamp: 1424334373346.029, type: "localcandidate", candidateType: "host", componentId: "1424334323058674 (id=93 url=http://127.0.0.1:9968/): stream1/audio", ipAddress: "192.168.1.10", mozLocalTransport: "udp", portNumber: 54914, transport: "udp" }

// And
{ id: "A6jP", timestamp: 1424334373346.029, type: "localcandidate", candidateType: "serverreflexive", componentId: "1424334323058674 (id=93 url=http://127.0.0.1:9968/): stream1/audio", ipAddress: "60.241.41.141", mozLocalTransport: "udp", portNumber: 54914, transport: "udp" }
```

- Remote Candidate
```
{ id: "CiEB", timestamp: 1424334373346.029, type: "remotecandidate", candidateType: "peerreflexive", componentId: "1424334323058674 (id=93 url=http://127.0.0.1:9968/): stream1/audio", ipAddress: "192.168.1.10", portNumber: 59067, transport: "udp" }
```

"inbound_rtp_audio_1" capture.js:441
Object { id: "inbound_rtp_audio_1", timestamp: 1424334373346.029, type: "inboundrtp", isRemote: false, mediaType: "audio", remoteId: "inbound_rtcp_audio_1", ssrc: "2351128174", bytesReceived: 235973, jitter: 0, packetsLost: 0, 1 more… } capture.js:442
"inbound_rtcp_audio_1" capture.js:441
Object { id: "inbound_rtcp_audio_1", timestamp: 1424334372507.582, type: "outboundrtp", isRemote: true, mediaType: "audio", remoteId: "inbound_rtp_audio_1", ssrc: "2351128174", bytesSent: 183457, packetsSent: 2420 } capture.js:442
"2dtX" capture.js:441
Object  capture.js:442
"cV3N" capture.js:441
Object  capture.js:442
"A6jP" capture.js:441
Object  capture.js:442
"CiEB" capture.js:441
Object 