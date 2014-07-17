/* jshint node: true */
'use strict';

var EventEmitter = require('events').EventEmitter;
var Reporter = require('./lib/reporter');
var TrackedConnection = require('./lib/connection').TrackedConnection;
var util = require('./lib/util');

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
  var connections = {};
  var timers = {};
  var logs = {};

  function log(peerId, pc, data) {
    pc.getStats(function(stats) {
      var reports = stats.result();
      var tc = connections[data.id];

      // Only reschedule while we are monitoring
      if (tc) {
        timers[data.id] = setTimeout(log.bind(this, peerId, pc, data), opts.pollInterval || 1000);  
      }
      
      var reporter = new Reporter(qc.id, data, reports);
      emitter.emit('health:report', reporter, pc);
    });   
  }

  /**
    Emit a generic notification event that allows for tapping into the activity that is happening
    within quickconnect
   **/
  function notify(eventName, opts) {
    var args = Array.prototype.slice.call(arguments, 2);
    emitter.emit('health:notify', eventName, opts, args);
    emitter.emit.apply(emitter, (['health:' + eventName, opts].concat(args)));
  }

  function trackConnection(peerId, pc, data) {
    var tc = new TrackedConnection(peerId, pc, data);
    connections[data.id] = tc;
    notify('started', { source: peerId, about: data.id, tracker: tc });
    log(peerId, pc, data);
    return tc;
  }

  /**
    Handle the peer connection being created
   **/
  qc.on('peer:connect', trackConnection);

  qc.on('peer:couple', function(peerId, pc, data, monitor) {

    // Store that we are currently tracking the target peer
    var tc = connections[data.id];
    if (!tc) tc = trackConnection(peerId, pc, data);

    monitor.on('change', function(pc) {
      notify('icestatus', { 
        source: qc.id, about: data.id, tracker: tc 
      }, pc.iceConnectionState);
      emitter.emit('health:changed', tc, pc.iceConnectionState);
    });

    monitor.on('closed', function() {

      tc.closed();

      // Stop the reporting for this peer connection
      if (timers[data.id]) clearTimeout(timers[data.id]);
      delete connections[data.id];
      notify('closed', { source: qc.id, about: data.id, tracker: tc });
    });

  });

  // Bind the signaller events
  ['init', 'open', 'connected', 'disconnected', 'error'].forEach(function(evt) {
    qc.on(evt, notify.bind(notify, evt, { source: qc.id, about: 'signaller' }));
  });

  // Bind peer connection events
  [
    'channel:opened', 'channel:closed', 
    'stream:added', 'stream:removed', 
    'call:started', 'call:ended'
  ].forEach(function(evt) {
    qc.on(evt, function(peerId) {
      var tc = connections[peerId];
      var args = Array.prototype.slice.call(arguments, 1);
      return notify.apply(
        notify, 
        [evt, { source: qc.id, about: peerId, tracker: tc }].concat(args)
      );
    });
  });

  return emitter;
};
