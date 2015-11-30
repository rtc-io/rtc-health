var util = require('./util');

function MonitoredConnection(qc, pc, data, opts) {
	opts = opts || {};

	this.source = qc.id;
	this.target = data.id;
	this.room = data.room;
	this.pc = pc;
	this.qc = qc;

	this._active = 0;
	this.started = Date.now();

	this._candidatesGathered = false;
	this._candidatesEnded = false;
	this._failureTimeout = null;
	this._failureCallback = opts.onFailure;
	this._timeUntilFailure = opts.timeUntilFailure;

	// These two events are the preconditions for starting the connection failure
	// countdown.
	var self = this;
	this._handlers = {
		gathercomplete: this._handleGatherComplete.bind(this),
		endofcandidates: this._handleCandidatesEnded.bind(this)
	};

	qc.on('pc.' + this.target + '.ice.gathercomplete', this._handlers.gathercomplete);
	qc.on('message:endofcandidates', this._handlers.endofcandidates);

	// Create a unique connection id
	this.connection_id = util.connectionId(this.source, this.target);
}

/**
  Add timestamps for connection
 **/
MonitoredConnection.prototype.closed = function() {
	this._active += (Date.now() - this.started);
	this.started = null;
	this._resetFailureConditions();
}

MonitoredConnection.prototype.close = function() {
	if (this.pc && this.pc.iceConnectionState != 'closed') {
		this.pc.close();
	}
}

/**
  Methods for notifying the MC of its connectivity state based on outside event
  knowledge.
 **/
MonitoredConnection.prototype.connected = function() {
	this._resetFailureConditions();
};

MonitoredConnection.prototype.failed = function() {
	this._onFailure();
};

/**
  Internal methods used in detecting connection failure
 **/
MonitoredConnection.prototype._handleGatherComplete = function() {
	this._candidatesGathered = true;
	this._checkFailureConditions();
};

MonitoredConnection.prototype._handleCandidatesEnded = function(msg, peer, raw) {
	if (peer.id === this.target) {
		this._candidatesEnded = true;
		this._checkFailureConditions();
	}
};

var CONNECTION_TIMEOUT_MSEC = 10 * 1000;

MonitoredConnection.prototype._checkFailureConditions = function() {
	if (this._failureTimeout) {
		return;
	}

	if (this._candidatesGathered && this._candidatesEnded) {
		var time = this._timeUntilFailure;
		if (time === undefined) {
			time = CONNECTION_TIMEOUT_MSEC;
		}
		var self = this;
		this._failureTimeout = setTimeout(function() {
			self._onFailure();
		}, time);
	}
};

MonitoredConnection.prototype._onFailure = function() {
	if (this._failureCallback) {
		this._failureCallback(this);
	}
	this._resetFailureConditions();
};

MonitoredConnection.prototype._resetFailureConditions = function() {
	this._candidatesGathered = false;
	this._candidatesEnded = false;
	if (this._failureTimeout) {
		clearTimeout(this._failureTimeout);
		this._failureTimeout = null;
	}

	this.qc.off('pc.' + this.target + '.ice.gathercomplete', this._handlers.gathercomplete);
	this.qc.off('message:endofcandidates', this._handlers.endofcandidates);
};

exports.MonitoredConnection = MonitoredConnection;
