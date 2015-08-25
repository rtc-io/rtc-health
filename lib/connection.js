var util = require('./util');

function MonitoredConnection(qc, pc, data, opts) {
	opts = opts || {};

	this.source = qc.id;
	this.target = data.id;
	this.room = data.room;
	this.pc = pc;

	this._active = 0;
	this.started = Date.now();

	this._candidatesGathered = false;
	this._candidatesEnded = false;
	this._failureTimeout = null;
	this._failureCallback = opts.onFailure;

	// These two events are the preconditions for starting the connection failure
	// countdown.
	var self = this;
	qc.on('pc.' + this.target + '.ice.gathercomplete', function() {
		self._gatherIsComplete();
	});
	qc.on('message:endofcandidates', function() {
		self._candidatesHaveEnded();
	});

	// Create a unique connection id
	this.connection_id = util.connectionId(this.source, this.target);
}

/**
  Add timestamps for connection
 **/
MonitoredConnection.prototype.closed = function() {
	this._active += (Date.now() - this.started);
	this.started = null;
}

MonitoredConnection.prototype.close = function() {
	if (this.pc && this.pc.iceConnectionState != 'closed') {
		this.pc.close();
		this._resetFailureConditions();
	}
}

/**
  Internal methods for detecting connection failure
 **/
var CONNECTION_TIMEOUT_SECONDS = 10;

MonitoredConnection.prototype._gatherIsComplete = function() {
	this._candidatesGathered = true;
	this._checkFailureConditions();
};

MonitoredConnection.prototype._candidatesHaveEnded = function() {
	this._candidatesEnded = true;
	this._checkFailureConditions();
};

MonitoredConnection.prototype._checkFailureConditions = function() {
	if (this._failureTimeout) {
		return;
	}

	if (this._candidatesGathered && this._candidatesEnded) {
		var self = this;
		this._failureTimeout = setTimeout(function() {
			if (self._failureCallback) {
				self._failureCallback(self);
			}
			self._resetFailureConditions();
		}, CONNECTION_TIMEOUT_SECONDS * 1000);
	}
};

MonitoredConnection.prototype._resetFailureConditions = function() {
	this._candidatesGathered = false;
	this._candidatesEnded = false;
	if (this._failureTimeout) {
		clearTimeout(this._failureTimeout);
		this._failureTimeout = null;
	}
};

exports.MonitoredConnection = MonitoredConnection;
