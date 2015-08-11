var extend = require('cog/extend');
var signaller = require('rtc-signaller');

module.exports = function(host, opts) {
  return signaller(host, extend({ reconnect: false }, opts));
};
