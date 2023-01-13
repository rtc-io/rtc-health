/* jshint node: true */
'use strict';

var EventEmitter = require('events').EventEmitter;
var Reporter = require('./lib/reporter');
var MonitoredConnection = require('./lib/connection').MonitoredConnection;
var error = require('./lib/error');
var util = require('./lib/util');
var wildcard = require('wildcard');
const detectProvider = require('./stats');

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

  console.log('### in local rtc-health 222 ###');

  opts = opts || {};

  var provider = null;
  var emitter = new EventEmitter();
  emitter.pollInterval = opts.pollInterval || 1000;
  var connections = {};
  var timers = {};
  var logs = {};

  function log(peerId, pc, data) {
    if (!provider) return;

    return provider.getStats(pc)
      .then(reports => provider.pushCustomCoviuStats(reports))
      .then(reports => {
        console.log('### reports-- ', reports);
        const tc = connections[data.id];

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
      })
      .catch(err => { 
        console.log('### err-- ', err);
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

  function connectionFailure() {
    var args = Array.prototype.slice.call(arguments);
    emitter.emit.apply(emitter, ['health:connection:failure'].concat(args));
  }

  function trackConnection(peerId, pc, data) {
    var tc = new MonitoredConnection(qc, pc, data, {
      timeUntilFailure: opts.connectionFailureTime,
      onFailure: connectionFailure,
    });
    connections[data.id] = tc;
    notify('started', { source: qc.id, about: data.id, tracker: tc });
    log(peerId, pc, data);
    return tc;
  }

  /**
    Handles connection closures, either as a result of the peer connection
    disconnecting, or the call ending (prior to a PC being created)
   **/
  function connectionClosed(peerId) {
    var tc = connections[peerId];
    if (!tc) return;
    tc.closed();

    // Stop the reporting for this peer connection
    if (timers[peerId]) clearTimeout(timers[peerId]);
    delete connections[peerId];

    // Emit a closure status update
    emitter.emit('health:report', new Reporter({
      source: qc.id,
      about: {
        id: peerId,
        room: tc.room
      },
      status: 'closed',
      force: true
    }));

    notify('closed', { source: qc.id, about: peerId, tracker: tc });
  }

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
          tc.connected();
        } else if (status === 'error') {
          tc.failed('ICE connection state error');
        }
      }
    });

    monitor.on('closed', connectionClosed.bind(this, peerId));
  });

  qc.on('call:failed', function(peerId) {
    var tc = connections[peerId];
    tc.failed('Call failed to connect');
  });

  // Close tracked connections on call:ended as well
  qc.on('call:ended', connectionClosed);

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
  };

  // Get the tracked connection for the given target peer
  emitter.getConnection = function(target) {
    return connections && connections[target];
  };

  // Provider detection
  function detect() {
    provider = detectProvider(opts);
    if (!provider) {
      console.log('WARNING! No WebRTC provider detected - rtc-health is disabled until a provider is detected');
    }
  }

  // In the case of some plugins, we don't get notified that it's using a plugin, and
  // have no means to reasonably identify the existence of a plugin
  // So as a final fallback, rerun the detection on a local announce
  qc.once('local:announce', detect);

  // Attempt to detect initially
  detect();
  return emitter;
};
