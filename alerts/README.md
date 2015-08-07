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

Currently, only the `threshold` alerter exists.

### Threshold

This alert type emits events when the monitored statistic(s) crosses some threshold.
The emission is debounced according to the `period` property in the options object, so you won't get any alerts if the bandwidth dips or spikes for less than `period` ms.

```js
var lowReceiveBandwidth = threshold('videoBwe', 'availableReceiveBandwidth', {
  alwaysAlertOnFirstReport: true, // reports on the initial value
  threshold: 1e6,  // Mbit/s
  period: 10*1000, // ms
});
```

The threshold alerter can also check multiple properties.
For exapmle, to monitor both sending and receiving bandwidth together:

```js
var lowBandwidth = threshold('videoBwe', ['availableSendBandwidth', 'availableReceiveBandwidth'], {
  ...
});
```
