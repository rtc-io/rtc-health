var lowpassEdges = require('../lib/lowpassEdges');

module.exports = function(type, property, opts) {
  if (!type || !property) {
    throw new Error('threshold needs a type and property/ies!');
  }

  if (!opts.threshold || !opts.period) {
    throw new Error('threshold requires threshold and period options');
  }

  var properties = typeof property === 'string'
    ? [property]
    : (property || []);

  var interval;

  // 'Member' variables for this particular alerter. Note that one alerter might
  // be 'instantiated' multiple times by being added in different ways, so these
  // one-time variables should only be things that relate to the input arguments.
  // All state should be kept in the context.
  var period = opts.period;
  var threshold = opts.threshold;
  var doFirstUpdate = opts.alwaysAlertOnFirstReport;

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

  function init(context, emit, myOpts, opts) {
    context.peerStates = {};
    context.firstUpdate = true;

    // This is expected to be called frequently, but only call its callback upon
    // significant events.
    context.outputSignal = lowpassEdges(function (anyLow) {
      emit(makeWarning(anyLow));
    }, period);

    interval = opts.pollInterval;
  }

  function onStatsReport(report, reporter, context, emit) {
    if (!context.peerStates[reporter.target]) {
      context.peerStates[reporter.target] = {low: false};
    }
    var state = context.peerStates[reporter.target];
    state.lastUpdate = +(new Date());

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
      emit(makeWarning(state.low));
      context.firstUpdate = false;
    }

    emitEventIfAnyPeersLow(context);
  }

  // This is a separate function because it's logically its own operation, even
  // if it could be inlined into the only place it's used.
  function emitEventIfAnyPeersLow(context) {
    var states = Object.keys(context.peerStates).map(getPeerState);
    var recentStates = states.filter(recent);
    var anyStatesLow = recentStates.some(getWarning);
    context.outputSignal(anyStatesLow);

    function getPeerState(key) {
      return context.peerStates[key];
    }
  }

  function recent(value) {
    var now = +(new Date());
    return (now - value.lastUpdate) < 1.5 * interval;
  }

  onStatsReport.type = type;
  onStatsReport.init = init;
  return onStatsReport;
};
