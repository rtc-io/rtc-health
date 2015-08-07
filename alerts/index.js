var EventEmitter = require('eventemitter3');

// This module is a call quality alerting service that sits on top of the
// rtc-health monitor module. That module provides low-level events that monitor
// the rtc connections in great detail; this module provides high-level
// user-friendly events that might be suitable for updating a UI.

module.exports = function(qc, opts) {
	opts = opts || {};
  var monitor = opts.monitor;

  if (!monitor) throw new Error('alerts must be given a monitor');

	var alerter = new EventEmitter();
  // These alerts are not dependent on any peer, and are supplied information
  // on all connected peers.
  var globalAlerts = {};
  // These alerts are only given information about a specific peer.
  var peerAlerts = {};

  alerter.addAlert = function(name, callback, opts) {
    opts = opts || {};
    var type = callback.type;
    if (!type) {
      throw new Error('alert callback has no type; is it a real callback?');
    }

    if (opts.peer && !peerAlerts[opts.peer]) {
      peerAlerts[opts.peer] = {};
    }

    var alerts = opts.peer ? peerAlerts[opts.peer] : globalAlerts;
    if (!alerts[type]) {
      alerts[type] = [];
    }

    name = 'warnings:'+name;

    var emit = function(data) {
      alerter.emit(name, data);
    };

    var context = {};
    if (callback.init) {
      callback.init(context, emit);
    }

    alerts[type].push({
      callback: callback,
      opts: opts,
      context: context,
      emit: emit,
    });
  }

	// Listen for health reports on all qc connections and monitor the statistics
	// we're interested in. This callback happens regularly, once for each peer
	// connection.
	monitor.on('health:report', function(reporter) {
    doAlerts(globalAlerts, reporter);
    var peer = reporter.target;
    if (peerAlerts[peer]) {
      doAlerts(peerAlerts[peer], reporter);
    }
	});

  function doAlerts(alerts, reporter) {
    reporter.reports.forEach(function(report) {
      var type = report.type;
      if (alerts[type]) {
        alerts[type].forEach(function(alertData) {
          alertData.callback(report, reporter, alertData.context);
        });
      }
    });
  }

	return alerter;
};
