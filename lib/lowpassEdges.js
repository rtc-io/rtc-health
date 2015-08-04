var debounce = require('debounce');

// This function converts a stream of events into just edges, but also lowpasses
// it so that anomalies are rejected. For example, let's say H and L are events
// with truthy and falsy values respectively. Given you've done
//
//     var g = lowpassEdges(f, 2);
//
//  You should see that calls to g like the following:
//
//  g: -L-L-H-H-H-H-H-L-H-L-L-H-L-L-L-L-
//
// Are translated into the following calls to f:
//
//  f: ---------T-------------------F---
//
// In this case the period was equal to about three event occurrences (it is
// assumed events are timed regularly), so after the third 'up' event, an up
// edge occurred, and after the third 'down' event, a down edge occurred. Notice
// the short periods of L in the middle that were filtered out.
// Note that the output event stream is composed of T (true) and F (false) values,
// not the input H (truthy) and L (falsy) values.
module.exports = function (fn, period) {
	var up = debounce(fn, period);
	var down = debounce(fn, period);

	return function(value) {
		// This looks backwards, but the use of the up() and down() functions is like
		// a juggler - they defer calls to fn with particular arguments. So while
		// value is true, we keep juggling the down event so it's not called.
		if (value) {
			down(false);
		} else {
			up(true);
		}
	}
}
