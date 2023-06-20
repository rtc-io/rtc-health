/**
  Detects and loads the correct provider for this browser
 **/
var providers = [
  require("./providers/standard"),
  require("./providers/twilio"),
  require("./providers/google"),
  require("./providers/mozilla"),
  require("./providers/temasys"),
  require("./providers/unsupported"),
]

module.exports = function (opts) {
  var detected = null
  var requested = opts && opts.provider
  // Check for the existing of the RTCPeerConnection
  for (var i = 0; i < providers.length; i++) {
    var pv = providers[i]
    var RTCPeerConnection = window[(pv.RTC_PREFIX || "") + "RTCPeerConnection"]
    if (
      (requested && requested === pv.id && RTCPeerConnection) ||
      (!requested && pv.check && pv.check())
    ) {
      detected = pv
      break
    }
  }

  return detected
}
