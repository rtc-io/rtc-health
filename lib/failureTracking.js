var doomCountdowns = {};
var haveEndedCandidates = {};
var haveCompletedGather = {};

function checkDoomCountdown(peerId) {
  if (doomCountdowns[peerId]) {
    return;
  }

  if (haveEndedCandidates[peerId] && haveCompletedGather[peerId]) {
    doomCountdowns[peerId] = setTimeout(function() {
      console.log('AAAAAAAAARRRRRGHHH failed to connect to peer %s', peerId);
      endDoomCountdown(peerId);
    }, 10 * 1000);
  }
}

function endDoomCountdown(peerId) {
  var doom = doomCountdowns[peerId];
  if (doom) {
    clearTimeout(doom);
  }
  delete doomCountdowns[peerId];
  delete haveEndedCandidates[peerId];
  delete haveCompletedGather[peerId];
}

module.exports = {
  checkDoomCountdown: checkDoomCountdown,
  haveEndedCandidates: haveEndedCandidates,
  haveCompletedGather: haveCompletedGather,
};
