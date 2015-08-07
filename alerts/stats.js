module.exports = function(type, property, opts) {
  if (!type || !property) {
    throw new Error('stat needs a type and property/ies!');
  }

  // We will accept either a single property name, or a list of property names.
  var properties = typeof property === 'string'
    ? [property]
    : property;

  // When we receive a report, analyse it for the conditions we care about. We
  // will only receive reports related to the 'type' of RTCStat passed in above,
  // so we just have to filter out the properties we're interested in.
  function onStatsReport(report, reporter, context, emit) {
    var stats = {};
    properties.forEach(function(prop) {
      stats[prop] = report.data[prop];
    });

    context.emit({
      peer: reporter.target,
      stats: stats,
    });
  }

  // These properties are needed by the alerter.addAlert function.
  onStatsReport.type = type;
  return onStatsReport;
};
