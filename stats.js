/* jshint node: true */
const detectProvider = require('./lib/provider');
const deriveRenderRateVolatility = require('./lib/custom-stats/render-rate-volatility');

module.exports = function(qc, opts) {

  opts = opts || {};
  const provider = detectProvider(opts);

  const getStats = (pc) => {
    return new Promise((resolve, reject) => {
      // A provider must be present for logging to be enabled
      if (!provider) return reject('No provider detected');
      provider.getStats(pc, null, function(err, reports) {
        if (err) return reject(err);
        return resolve(reports);
      });
    });
  }

  const getConnectionStats = (pc) => {
    return getStats(pc).then((reports) => {
      const candidatePair = reports.filter((r) => r.type === 'candidatePair' && r.data.writable && r.data.nominated)[0];
      const outboundRtp = reports.filter((r) => r.type === 'outboundRtp');
      // Available outgoing bitrate not defined (Firefox)
      if (candidatePair && candidatePair.data && typeof candidatePair.data.availableOutgoingBitrate === 'undefined') {
        // Add a compatibility stat in (not quite the same, as this is purely based off the data that is being sent, as opposed to
        // the potential, so named differently but possibly should just be the availableOutgoingBitrate for compatibility)
        candidatePair.data.rtcOutgoingBitrateMean = outboundRtp.reduce((result, report) => {
          return result + (report.data.bitrateMean || 0);
        }, 0);
      }

      return candidatePair;
    });
  }

  const pushCustomCoviuStats = (stats) => {
    return Promise.resolve()
      .then(() => deriveRenderRateVolatility(stats))
      .then(renderRateVolitilityStats => {
        return [...stats, ...renderRateVolitilityStats];
      });
  };

  return { provider, getStats, getConnectionStats, pushCustomCoviuStats };
};
