module.exports = function(type, property, opts) {
  if (!type || !property) {
    throw new Error('average needs a type and property/ies!');
  }

  var properties = typeof property === 'string'
    ? [property]
    : (property || []);

  var interval;

  // Called once when we are added to an alerter. All arguments to this function
  // are unique to this instance of the alerter being added.
  // 'emit' should be called when we want to emit an event, and opts and myOpts
  // are the options the alerter was created with, and the options we were added
  // with, respectively.
  function init(monitor, context, emit, myOpts, opts, callback) {
    if (monitor.pollInterval >= period) {
      return callback('Threshold period must be greater than the monitor polling interval');
    }
    // Because we may be listening to updates from many peers, we'll keep unique
    // statistics for each of them.
    context.peerStates = {};

    // The epoch counter ensures we only create an event when all active peers
    // have had a chance to report their stats.
    context.epoch = 0;

    interval = opts.pollInterval;
    return callback();
  }

  // When we receive a report, analyse it for the conditions we care about.
  function onStatsReport(report, reporter, context, emit) {
    // Create a new state for this peer if we don't have one already.
    if (!context.peerStates[reporter.target]) {
      context.peerStates[reporter.target] = {stats: {}};
    }
    var state = context.peerStates[reporter.target];
    state.lastUpdate = +(new Date());
    state.epoch = context.epoch;

    // Copy the stats into the peer state.
    properties.forEach(function(prop) {
      state.stats[prop] = report.data[prop];
    });

    var peers = Object.keys(context.peerStates).map(getPeerState);
    var activePeers = peers.filter(recent);

    // If all active peers have the same epoch, we can calculate and report an
    // average statistic!
    var currentEpoch = function(peer) { return peer.epoch === context.epoch; };
    if (activePeers.length && activePeers.every(currentEpoch)) {
      var averages = {};
      properties.forEach(function(prop) {
        averages[prop] = 0;
        activePeers.forEach(function(peer) {
          averages[prop] += (peer.stats[prop] || 0);
        });
        averages[prop] /= activePeers.length;
      });

      emit(averages);

      // Advance the epoch so we won't emit again until we have received another
      // update from all peers.
      context.epoch = context.epoch + 1;
    }

    function getPeerState(key) {
      return context.peerStates[key];
    }
  }

  // In order to prevent dropped connections with low bandwidth from clogging
  // up future monitoring, we discard states that haven't been updated for a
  // while. 'A while' is subjective.
  function recent(value) {
    var now = +(new Date());
    return (now - value.lastUpdate) < 1.5 * interval;
  }

  onStatsReport.type = type;
  onStatsReport.init = init;
  return onStatsReport;
};
