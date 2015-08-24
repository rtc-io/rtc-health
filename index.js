/* jshint node: true */
'use strict';

var EventEmitter = require('events').EventEmitter;
var Reporter = require('./lib/reporter');
var MonitoredConnection = require('./lib/connection').MonitoredConnection;
var error = require('./lib/error');
var util = require('./lib/util');
var provider = require('./lib/provider');
var wildcard = require('wildcard');
var trackFailures = require('./lib/failureTracking');

var OPTIONAL_MONITOR_EVENTS = [
    'negotiate:request', 'negotiate:renegotiate', 'negotiate:abort',
    'negotiate:createOffer', 'negotiate:createOffer:created', 
    'negotiate:createAnswer', 'negotiate:createAnswer:created',
    'negotiate:setlocaldescription',
    'icecandidate:local', 'icecandidate:remote', 'icecandidate:gathered', 'icecandidate:added',
    'sdp:received'
];

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

  if (!provider) {
    console.log('WARNING! No WebRTC provider detected - rtc-health is disabled');
    return;
  }

  opts = opts || {};

  var emitter = new EventEmitter();
  emitter.pollInterval = opts.pollInterval || 1000;
  var connections = {};
  var timers = {};
  var logs = {};
  var failureTracker = trackFailures(function onConnectionFailure(peerId) {
    emitter.emit('health:connection:failure', {peer: peerId});
  });

  function log(peerId, pc, data) {
    provider.getStats(pc, null, function(err, reports) {
      var tc = connections[data.id];

      // Only reschedule while we are monitoring
      if (tc) {
        timers[data.id] = setTimeout(log.bind(this, peerId, pc, data), emitter.pollInterval);
      }
      
      var reporter = new Reporter({
            source: qc.id, 
            about: data,
            pc: pc,
            reports: reports
          });

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
    var tc = new MonitoredConnection(qc.id, pc, data);
    connections[data.id] = tc;
    notify('started', { source: qc.id, about: data.id, tracker: tc });
    log(peerId, pc, data);
    var gatherEvent = 'pc.' + peerId + '.ice.gathercomplete';
    qc.on(gatherEvent, function() {
      failureTracker(peerId).gatherIsComplete();
    });
    return tc;
  }

  qc.on('message:endofcandidates', function(msg, peer, raw) {
    failureTracker(peer.id).candidatesHaveEnded();
  });

  /**
    Handle the peer connection being created
   **/
  qc.on('peer:connect', trackConnection);

  qc.on('peer:couple', function(peerId, pc, data, monitor) {    

    // Store that we are currently tracking the target peer
    var tc = connections[data.id];
    var status = util.toStatus(pc.iceConnectionState);
    if (!tc) tc = trackConnection(peerId, pc, data);

    monitor.on('statechange', function(pc, state) {
      var iceConnectionState = pc.iceConnectionState;
      var newStatus = util.toStatus(iceConnectionState);
      notify('icestatus', { 
        source: qc.id, about: data.id, tracker: tc 
      }, iceConnectionState);
      emitter.emit('health:changed', tc, iceConnectionState);

      if (status != newStatus) {
        emitter.emit('health:connection:status', tc, newStatus, status);
        status = newStatus;

        if (status === 'connected') {
          failureTracker(peerId).reset();
        }
      }
    });

    monitor.on('closed', function() {
      
      tc.closed();

      // Stop the reporting for this peer connection
      if (timers[data.id]) clearTimeout(timers[data.id]);
      delete connections[data.id];

      // Emit a closure status update
      emitter.emit('health:report', new Reporter({
        source: qc.id, 
        about: data,
        status: 'closed',
        force: true
      }));

      notify('closed', { source: qc.id, about: data.id, tracker: tc });
    });

  });

  // Setup to listen to the entire feed
  qc.feed(function(evt) {
    var name = evt.name;

    if (util.SIGNALLER_EVENTS.indexOf(name) >= 0) {
      return notify.apply(
        notify, 
        [name, { source: qc.id, about: 'signaller' }].concat(evt.args)
      );
    }

    // Listen for the optional verbose events
    var matching = opts.verbose && wildcard('pc.*', name);
    if (matching) {
      var peerId = matching[1];
      var shortName = matching.slice(2).join('.');
      var tc = connections[peerId];
      return notify.apply(
        notify, 
        [shortName, { source: qc.id, about: peerId, tracker: tc }].concat(evt.args)
      );
    }
  });

  // Helper method to safely close all connections
  emitter.closeConnections = function() {
    for (var connId in connections) {
      connections[connId].close();
    }
  };

  // Helper method to expose the current tracked connections
  emitter.getConnections = function() {
    var results = [];
    for (var target in connections) {
      results.push(connections[target]);
    }
    return results;
  }

  return emitter;
};
