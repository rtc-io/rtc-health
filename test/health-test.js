var test = require('tape');
var async = require('async');
var quickconnect = require('rtc-quickconnect');
var health = require('..');
var connections = [];
var dcs = [];
var room = 'rtchealth-ut-' + require('uuid').v4();
var signallingServer = 'http://rtc.io/switchboard/';

// require('cog/logger').enable('*');

function newPeer(t, callback) {
    t.test('create a new peer', function(t) {
        t.plan(2);
        var connection = quickconnect(signallingServer, { room: room });
        t.ok(connection, 'new quickconnect created');
        var monitor = health(connection, { pollInterval: 10000 });
        t.ok(monitor, 'monitor attached');
        return callback(null, { connection: connection, monitor: monitor } );  
    });
}

test('rtc-health events', function(t) {

    var createPeer = newPeer.bind(newPeer, t);
    async.parallel([createPeer, createPeer], function(err, peers) {
            
        t.ok(peers.length === 2, 'two peers created');

        var source = peers[0];
        var target = peers[1];
        var connectionId = (source.connection.id < target.connection.id 
                ? source.connection.id + ':' + target.connection.id 
                : target.connection.id + ':' + source.connection.id
            );
        t.test('connection events', function(t) {
            t.plan(3);
            source.monitor.on('health:started', function(data) {
                console.log(data);
                t.ok(true, 'peer connection started');
                t.equal(source.connection.id, data.source, 'source peer matches connection source');
                t.equal(target.connection.id, data.about, 'target peer matches connection source');
                t.end();
            });    
        });

        t.test('health report', function(t) {
            source.monitor.on('health:report', function(report) {
                console.log(report);
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