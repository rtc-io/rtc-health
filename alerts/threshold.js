var lowpassEdges = require('../lib/lowpassEdges');

module.exports = function(type, properties, opts) {
  var period = opts.period;
  var threshold = opts.threshold;
  var doFirstUpdate = opts.firstUpdate;

  // Because we may be listening to updates from many peers, we'll threshold
  // across all of them. We need to keep a 'working memory' of the state of
  // each peer (i.e. whether they were below the threshold last update).
  var peerStates = {};

  function getPeerState(key) {
    return peerStates[key];
  }

  // Accept a single property name or a list of them.
  if (typeof properties === 'string') {
    properties = [properties];
  }

  // Converts from a single true/false value to the type of event we're expected
  // to emit.
  function makeWarning(anyLow) {
    return {low: anyLow};
  }

  var emitter;
  var firstUpdate = true;
  var updatePeerStates = function(report, reporter, emit, context) {
    // Update this more-broadly-scoped reference to the emitter so it can be
    // used in our lowpassed function, outputSignal, below. This function
    // should never actually change; it's just not available in the right scope
    // for us because of the lowpass.
    emitter = emit;

    if (!peerStates[reporter.target]) {
      peerStates[reporter.target] = {low: false};
    }
    var state = peerStates[reporter.target];
    var values = properties.map(function(prop) {
      return report.data[prop];
    });

    if (values.some(function(v) { return v < threshold; })) {
      state.low = true;
    } else {
      state.low = false;
    }

    // If this is the first time we've updated and we're below the threshold,
    // we'll fire an event immediately. This is necessary because the lowpassed
    // signal output doesn't fire on the first event.
    if (firstUpdate && doFirstUpdate && state.low) {
      emit(makeWarning(state.low));
      firstUpdate = false;
    }
    state.lastUpdate = +(new Date());

    emitEventIfAnyPeersLow();
  }

  // Type of RTCStats reports we pay attention to.
  updatePeerStates.type = type;

  // This is expected to be called frequently, but only call its callback upon
  // significant events.
  var outputSignal = lowpassEdges(function (anyLow) {
    emitter(makeWarning(anyLow));
  }, period);

  // This is a separate function because it's logically its own operation, even
  // if it could be inlined into the only place it's used.
  function emitEventIfAnyPeersLow() {
    var states = Object.keys(peerStates).map(getPeerState);
    var recentStates = states.filter(withinTimeWindow);
    var anyStatesLow = recentStates.some(function(s) { return s.low; });
    outputSignal(anyStatesLow);

    // In order to prevent dropped connections with low bandwidth from clogging
    // up future monitoring, we discard states that haven't been updated for a
    // while. Where 'a while' is subjective.
    function withinTimeWindow(value) {
      var now = +(new Date());
      return (now - value.lastUpdate) < 2*period;
    }
  }

  return updatePeerStates;
};
