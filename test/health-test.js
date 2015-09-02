var test = require('tape');
var async = require('async');
var quickconnect = require('rtc-quickconnect');
var health = require('..');
var peerHelper = require('./helpers/peer');
var connections = [];
var dcs = [];
var room = 'rtchealth-ut-' + require('uuid').v4();

// require('cog/logger').enable('*');
module.exports = function(signallingServer) {

    var newPeer = peerHelper.peerCreator(signallingServer, {room: room, monitorOpts: { pollInterval: 10000 } });

    test('rtc-health events', function(t) {

        var createPeer = newPeer.bind(newPeer, t);
        async.parallel([createPeer, createPeer], function(err, peers) {
                
            t.ok(peers.length === 2, 'two peers created');

            var source = peers[0];
            var target = peers[1];
            source.monitor.on('health:started', function(data) {
              console.log('received started event');
            });
            target.monitor.on('health:started', function(data) {
              console.log('received started event');
            });
            var connectionId = (source.connection.id < target.connection.id 
                    ? source.connection.id + ':' + target.connection.id 
                    : target.connection.id + ':' + source.connection.id
                );
            t.test('connection events', function(t) {
                t.plan(3);
                console.log('attaching test listener');
                source.monitor.on('health:started', function(data) {
                    t.ok(true, 'peer connection started');
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
                    t.equal('connecting', report.status, 'connection status is connecting');         
                    t.end();
                });
            });  
        });
    });
}
