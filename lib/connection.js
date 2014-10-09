var util = require('./util');

function MonitoredConnection(id, pc, opts) {
	this.source = id;
	this.target = opts.id;
	this.room = opts.room;
	this.pc = pc;

	this._active = 0;
	this.started = Date.now();

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
	if (this.pc && this.pc.iceConnectionState != 'closed') this.pc.close();
}

exports.MonitoredConnection = MonitoredConnection;