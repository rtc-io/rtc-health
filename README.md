# rtc-health

rtc-health endeavours to provide monitoring and health reporting data for WebRTC peer connections that are created using [rtc-quickconnect](http://github.com/rtc-io/rtc-quickconnect). It will expose the events from the rtc-quickconnect instance, as well as providing statistical reports relating to the connection, and the various tracks/channels.

[![Build Status](https://img.shields.io/travis/rtc-io/rtc-health.svg?branch=master)](https://travis-ci.org/rtc-io/rtc-health)

### Providers

Currently, Chrome and Firefox do not implement the WebRTC.getStats API method in even remotely the same way, leading to some problems when it comes to standardizing the output of data. To get around this, rtc-health implements a provider for each browser that handles the execution and standardization of stats retrieval.

#### Google Chrome

As the original implementor of the getStats method, and as such, containing a much wider array of reported metrics, Chrome is used as the baseline for the provider getStats. Standardization consists of removing 

#### Mozilla Firefox

Firefox reports only basic information via it's getStats method for each MediaStreamTrack.