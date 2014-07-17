var util = require('./util');

function TrackedConnection(id, pc, opts) {
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
TrackedConnection.prototype.closed = function() {
	this._active += (Date.now() - this.started);
	this.started = null;
}

exports.TrackedConnection = TrackedConnection;