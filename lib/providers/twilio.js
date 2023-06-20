/**
 * The standard provider deals with StatsReport that adhere to the common standard
 */
var bowser = require("bowser")
var StatsReport = require("../statsreport")
var util = require("../util")
var EXCLUDE_FIELDS = ["id", "type"]
// Don't send reports about the certificate or codec information
var EXCLUDE_TYPES = ["certificate", "codec"]
var FIELD_PREFIX = ""
var getStats = undefined

/**
  Convert the Chrome RTCStatsReport to a StatsReport
 **/
function convertToStatsReport(report, compare) {
  if (!report || !report.type || EXCLUDE_TYPES.indexOf(report.type) !== -1)
    return

  var result = new StatsReport({
    id: report.id,
    type: util.standardizeKey(FIELD_PREFIX, report.type),
    subType:
      report.type === "ssrc"
        ? report.id.indexOf("send") > 0
          ? "send"
          : "receive"
        : undefined,
    timestamp: report.timestamp,
    version: "1.0", // WebRTC 1.0
  })

  Object.keys(report)
    .filter((k) => EXCLUDE_FIELDS.indexOf(k) === -1)
    .map((key) => {
      var standardKey = util.standardizeKey(FIELD_PREFIX, key)
      var value = report[key]
      result.set(standardKey, value)
    })
  return result
}

/**
  Twilio WebRTC Stats Report
 **/
exports.id = "twilio"

/**
  
 **/
exports.getStats = function (pc, opts, callback) {
  return new Promise((resolve, reject) => {
    if (!getStats || typeof getStats !== "function") return resolve()
    // Handle stats requests hanging on Firefox if the connection is closing
    let timer = setTimeout(() => reject("Timed out"), 1000)
    getStats().then((stats) => {
      console.log("khoa debug stats", stats)
      clearTimeout(timer)
      if (!stats) return callback("Could not getStats")
      let localAudioStats = stats[0].localAudioTrackStats[0]
      let localVideoStats = stats[0].localVideoTrackStats[0]
      let remoteAudioStats = stats[0].remoteAudioTrackStats[0]
      let remoteVideoStats = stats[0].remoteVideoTrackStats[0]

      let candidatePair = localAudioStats
        ? convertToStatsReport({
            id: stats[0].peerConnectionId,
            type: "candidate-pair",
            timestamp: localAudioStats.timestamp,
            bytesSent:
              (localAudioStats?.bytesSent || 0) +
              (localVideoStats?.bytesSent || 0),
            bytesSentPerSec: 0,
            bytesReceived:
              (remoteAudioStats?.bytesReceived || 0) +
              (remoteVideoStats?.bytesReceived || 0),
            bytesReceivedPerSec: 0,
            currentRoundTripTime: 0,
            writable: true,
            nominated: true,
          })
        : undefined
      let inboundRtpAudio = remoteAudioStats
        ? convertToStatsReport({
            id: remoteAudioStats.trackId,
            type: "inbound-rtp",
            timestamp: remoteAudioStats.timestamp,
            ...remoteAudioStats,
            mediaType: "audio",
            kind: "audio",
          })
        : undefined
      let inboundRtpVideo = remoteVideoStats
        ? convertToStatsReport({
            id: remoteVideoStats.trackId,
            type: "inbound-rtp",
            timestamp: remoteVideoStats.timestamp,
            ...remoteVideoStats,
            mediaType: "video",
            kind: "video",
          })
        : undefined
      let outboundRtpAudio = localAudioStats
        ? convertToStatsReport({
            id: localAudioStats.trackId,
            type: "outbound-rtp",
            timestamp: localAudioStats.timestamp,
            ...localAudioStats,
            mediaType: "audio",
            kind: "audio",
          })
        : undefined
      let outboundRtpVideo = localVideoStats
        ? convertToStatsReport({
            id: localVideoStats.trackId,
            type: "outbound-rtp",
            timestamp: localVideoStats.timestamp,
            ...localVideoStats,
            mediaType: "video",
            kind: "video",
          })
        : undefined
      return resolve(
        [
          inboundRtpAudio,
          inboundRtpVideo,
          outboundRtpAudio,
          outboundRtpVideo,
          candidatePair,
        ].filter((s) => !!s)
      )
    })
  })
    .then((data) => callback(null, data))
    .catch((err) => {
      callback("Could not getStats")
    })
}

/**
  Check if we are using a browser that is supporting the standardized stats reports
 **/
exports.check = function () {
  return bowser && bowser.check({ safari: "12" }, true)
}

exports.setGetStatsFn = function (getStatsFn) {
  getStats = getStatsFn
}
