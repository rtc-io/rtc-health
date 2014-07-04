/* jshint node: true */
'use strict';

var EventEmitter = require('events').EventEmitter;
var Reporter = require('./lib/reporter');

/**
  # rtc-health

  The `rtc-health` module helps make it easier to expose health information
  about your RTC connections. It hooks into the WebRTC Stats API, as well as the
  underlying signaller and PeerConnection events to provide insight as to events, 
  and metrics about any peer connections initiated by the provided quickconnect instance.

  ## Example Usage

  <<< examples/basic.js

  This shows some simple logging of the sdp filter, and events

  <<< examples/capture.js

  This captures data for video streaming

**/

module.exports = function(qc, opts) {
	opts = opts || {};

	var emitter = new EventEmitter();
  var targets = [];
  var timers = {};

  function log(pc, data) {
  	pc.getStats(function(stats) {
        var reports = stats.result();
        var idx = targets.indexOf(data.id);

        // Only reschedule while we are monitoring
        if (idx >= 0) {
          timers[data.id] = setTimeout(log.bind(this, pc, data), opts.pollInterval || 1000);  
        }
        
        var reporter = new Reporter(qc.id, data, reports);
        emitter.emit('health:report', reporter, pc);
		});		
  }

  qc.on('peer:connect', log);

  qc.on('peer:couple', function(pc, data, monitor) {

    // Store that we are currently tracking the target peer
    if (targets.indexOf(data.id) <= 0) targets.push(data.id);

  	monitor.on('change', function(pc) {
			emitter.emit('health:changed', pc.iceConnectionState, pc);
  	});

  	monitor.on('closed', function() {

      // Stop the reporting for this peer connection
      if (timers[data.id]) clearTimeout(timers[data.id]);
      var idx = targets.indexOf(data.id);
      if (idx >= 0) targets.splice(idx, 1);

  		emitter.emit('health:closed', pc);

  	});

  });

  return emitter;
};
