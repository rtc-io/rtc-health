# Alerts

The basic monitor in `rtc-health` notifies you of every single RTC connection statistic reported by the browser, which is a lot of data.
You can use this module to construct higher-level alerts that only fire, for example, when some statistic goes below an unacceptable threshold.
Here's a basic example of that:

```js
var health = require('rtc-health');
var alerter = require('rtc-health/alerts');
var threshold = require('rtc-health/alerts/threshold');

var monitor = health(qc, ...);

var alerts = alerter(monitor);

// Create an example type of event to listen for. In this case, we'll watch for any
// 'videoBwe' type packets whose 'availableSendBandwidth' property crosses a threshold
// we define.
var lowSendBandwidth = threshold('videoBwe', 'availableSendBandwidth', {
  threshold: 1e6,  // Mbit/s
  period: 10*1000, // ms
});

// Calling addAlert by default will monitor for this alert on _all_ peer connections.
alerts.addAlert('warning:bandwidth', lowSendBandwidth);

// Listen for the named event to receive updates:
alerts.on('warning:bandwidth', function(data) {
  // Fires whenever the minimum of the available bandwidth among all peers crosses
  // 1Mbps for 10 seconds or more.
  console.log('there is', data.low ? 'a' : 'no', 'bandwidth problem');
});

// Calling addAlert with a specific peer will only monitor that peer's statistics.
alerts.addAlert('warning:friendBandwidth', lowSendBandwidth, {
  peer: friendPeerId,
});

alerts.on('warning:friendBandwidth', function(data) {
  console.log('peer with id', friendPeerId, 'has', data.low ? 'low' : 'ok', 'bandwidth');
});
```

## Alert types

### Stats

The `stats` alerter simply re-emits statistics as soon as they come in, but allows you to more nicely select just the stats you want.

```js
var stats = require('rtc-health/alerts/stats');
var sendStat = stats('videoBwe', 'availableSendBandwidth');
alerter.addAlert('stat:sendbw', sendStat);
alerter.on('stat:sendbw', function(data) {
  console.log('peer id:', data.peer);
  console.log('send bandwidth:', data.stats.availableSendBandwidth);
});
```

The frequency these events will be emitted depends on:

 * The monitoring period of the health monitor you create
 * The number of peers (each peer is checked, unless you attach this monitor to a specific peer)

You can also monitor multiple statistics at the same time:

```js
var bothStat = stats('videoBwe', ['availableSendBandwidth', 'availableReceiveBandwidth']);
```

### Average

The `average` alert type will calculate average statistics for all connected peers.

```js
var stats = require('rtc-health/alerts/stats');
var averageSendBw = average('videoBwe', 'availableSendBandwidth');
alerter.addAlert('stat:avgsendbw', sendStat);
alerter.on('stat:avgsendbw', function(data) {
  console.log('average send bandwidth:', data.availableSendBandwidth);
});
```

As with the `stats` type, you can pass multiple property names.

### Threshold

This alert type emits events when the monitored statistic(s) crosses some threshold.
Note this monitors the statistic on all peers and considers the _minimum_ of their values.

```js
var threshold = require('rtc-health/alerts/threshold');
var lowReceiveBandwidth = threshold('videoBwe', 'availableReceiveBandwidth', {
  alwaysAlertOnFirstReport: true, // reports on the initial value
  threshold: 1e6,  // Mbit/s
  period: 10*1000, // ms
});
alerts.on('warning:bandwidth', function(data) {
  // low is true if the stat is below the given threshold.
  console.log(data.low);
});
```

The alert event is debounced according to the `period` property in the options object, so you won't get any alerts if the statistic dips or spikes for less than `period` ms.

As with the `stats` type, you can pass multiple property names.
For exapmle, to monitor both sending and receiving bandwidth together:

```js
var lowBandwidth = threshold('videoBwe', ['availableSendBandwidth', 'availableReceiveBandwidth'], {
  ...
});
```
