var lowpassEdges = require('../lib/lowpassEdges');

module.exports = function(type, properties, opts) {
  // 'Member' variables for this particular alerter. Note that one alerter might
  // be 'instantiated' multiple times by being added in different ways, so these
  // one-time variables should only be things that relate to the input arguments.
  // All state should be kept in the context.
  var period = opts.period;
  var threshold = opts.threshold;
  var doFirstUpdate = opts.firstUpdate;

  // We accept a single property name or a list of them. In the case of the
  // former, convert it to a list.
  if (typeof properties === 'string') {
    properties = [properties];
  }

  function belowThreshold(v) {
    return v < threshold;
  }

  // Converts from a single true/false value to the type of event we're expected
  // to emit.
  function makeWarning(anyLow) {
    return {low: anyLow};
  }

  // And back the other direction.
  function getWarning(value) {
    return value.low;
  }

  // Called once when we are added to an alerter.
  function init(context, emit) {
    // We need to store this so we can emit unconditionally on the first update.
    context.emit = emit;
    context.firstUpdate = true;

    // Because we may be listening to updates from many peers, we'll threshold
    // across all of them. We need to keep a 'working memory' of the state of
    // each peer (i.e. whether they were below the threshold last update).
    context.peerStates = {};

    // This is expected to be called frequently, but only call its callback upon
    // significant events.
    context.outputSignal = lowpassEdges(function (anyLow) {
      emit(makeWarning(anyLow));
    }, period);
  }

  // When we receive a report, analyse it for the conditions we care about.
  function onStatsReport(report, reporter, context) {
    if (!context.peerStates[reporter.target]) {
      context.peerStates[reporter.target] = {low: false};
    }
    var state = context.peerStates[reporter.target];

    var values = properties.map(function(prop) { return report.data[prop]; });
    var anyLow = values.some(belowThreshold);
    if (anyLow) {
      state.low = true;
    } else {
      state.low = false;
    }

    // If this is the first time we've updated and we're below the threshold,
    // we'll fire an event immediately. This is necessary because the lowpassed
    // signal output doesn't fire on the first event.
    if (context.firstUpdate && doFirstUpdate && state.low) {
      context.emit(makeWarning(state.low));
      context.firstUpdate = false;
    }
    state.lastUpdate = +(new Date());

    emitEventIfAnyPeersLow(context);
  }

  // This is a separate function because it's logically its own operation, even
  // if it could be inlined into the only place it's used.
  function emitEventIfAnyPeersLow(context) {
    var states = Object.keys(context.peerStates).map(getPeerState);
    var recentStates = states.filter(withinTimeWindow);
    var anyStatesLow = recentStates.some(getWarning);
    context.outputSignal(anyStatesLow);

    function getPeerState(key) {
      return context.peerStates[key];
    }
  }

  // In order to prevent dropped connections with low bandwidth from clogging
  // up future monitoring, we discard states that haven't been updated for a
  // while. Where 'a while' is subjective.
  function withinTimeWindow(value) {
    var now = +(new Date());
    return (now - value.lastUpdate) < 2*period;
  }

  onStatsReport.type = type;
  onStatsReport.init = init;
  return onStatsReport;
};
