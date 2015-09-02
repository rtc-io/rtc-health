var test = require('tape');
var async = require('async');
var quickconnect = require('rtc-quickconnect');
var health = require('..');
var peerHelper = require('./helpers/peer');
var connections = [];
var dcs = [];
var room = 'rtchealth-ut-' + require('uuid').v4();
var Promise = require('es6-promise').Promise;

// require('cog/logger').enable('*');
module.exports = function(signallingServer) {

    var newPeer = peerHelper.peerCreator(signallingServer, {room: room, monitorOpts: { pollInterval: 10000 } });

    test('rtc-health events', function(t) {

        var createPeer = newPeer.bind(newPeer, t);
        async.parallel([createPeer, createPeer], function(err, peers) {
                
            t.ok(peers.length === 2, 'two peers created');

            var source = peers[0];
            var target = peers[1];

            // The 'started' event may fire more than once, but for this test
            // we only care about the first occurrence. And because we may miss
            // the first occurrence if we add the listener too late, we'll create
            // the listener here and promisify it.
            var sourceStarted = new Promise(function(resolve, reject) {
              source.monitor.on('health:started', function(data) {
                resolve(data);
              });
            });

            var connectionId = (source.connection.id < target.connection.id 
                    ? source.connection.id + ':' + target.connection.id 
                    : target.connection.id + ':' + source.connection.id
                );
            t.test('connection events', function(t) {
                sourceStarted.then(function(data) {
                    t.pass('peer connection started');
                    t.equal(source.connection.id, data.source, 'source peer matches connection source');
                    t.equal(target.connection.id, data.about, 'target peer matches connection source');
                    t.end();
                });
            });

            t.test('health report', function(t) {
                source.monitor.on('health:report', function(report) {
                    t.equal(source.connection.id, report.source, 'report peer matches connection source');
                    t.equal(target.connection.id, report.target, 'report target matches target peer');
                    t.equal(report.room, room, 'report room matches');
                    t.equal(report.connection_id, connectionId, 'report connection id is correct');
                    t.equal(report.status, 'connecting', 'connection status is connecting');
                    t.end();
                });
            });  
        });
    });
}
