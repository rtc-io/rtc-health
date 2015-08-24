var CONNECTION_TIMEOUT_SECONDS = 10;

// Close over the warning function so we can pass it to all created monitors.
module.exports = function(warn) {
  var monitors = {};

  // Create or lookup a monitor for a particular peer.
  return function(peerId) {
    if (monitors[peerId]) {
      return monitors[peerId];
    } else {
      return (monitors[peerId] = new ConnectionFailureMonitor(peerId, warn));
    }
  };
};

function ConnectionFailureMonitor(peerId, warn) {
  if (!this instanceof ConnectionFailureMonitor) {
    return new ConnectionFailureMonitor(peerId, warn);
  }

  this.peerId = peerId;
  this.warn = warn;
  this.gathered = false;
  this.ended = false;
  this.timeout = undefined;
}

ConnectionFailureMonitor.prototype.gatherIsComplete = function() {
  this.gathered = true;
  this.check();
};

ConnectionFailureMonitor.prototype.candidatesHaveEnded = function() {
  this.ended = true;
  this.check();
};

ConnectionFailureMonitor.prototype.check = function() {
  if (this.timeout) {
    return;
  }

  if (this.gathered && this.ended) {
    var self = this;
    this.timeout = setTimeout(function() {
      self.warn(self.peerId);
      self.reset();
    }, CONNECTION_TIMEOUT_SECONDS * 1000);
  }
};

ConnectionFailureMonitor.prototype.reset = function() {
  this.gathered = false;
  this.ended = false;
  if (this.timeout) {
    clearTimeout(this.timeout);
    this.timeout = undefined;
  }
};
