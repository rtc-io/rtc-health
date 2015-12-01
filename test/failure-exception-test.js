var test = require('tape');
var async = require('async');
var peerHelper = require('./helpers/peer');
var room = 'rtchealth-ut-' + require('uuid').v4();

module.exports = function(signallingServer) {

    var newPeer = peerHelper.peerCreator(signallingServer, {
        room: room,
        // Block all actual connections from occuring!
        filterCandidate: function() {
          return false;
        },
        monitorOpts: {
            pollInterval: 10000,
            // The failure time can be arbitrary and small since connections are
            // blocked. Long timeouts here just make the tests slower.
            connectionFailureTime: 500,
        },
    });

    test('failure does not get reported if call is terminated prior to connection', function(t) {
        var createPeer = newPeer.bind(newPeer, t);
        async.parallel([createPeer, createPeer], function(err, peers) {
            t.ok(peers.length === 2, 'two peers created');


            t.test('termination', function(t1) {
                t1.plan(3);
                var source = peers[0];
                var target = peers[1];

                function failOnFailure(tc, err) {
                    t1.fail('A health connection failure was detected [' + err + ']');
                }

                source.monitor.on('health:connection:failure', failOnFailure);
                target.monitor.on('health:connection:failure', failOnFailure);

                source.connection.on('call:ended', t1.pass.bind(t1, 'Source call was ended'));
                target.connection.on('call:ended', t1.pass.bind(t1, 'Target call was ended'));

                source.connection.on('peer:couple', function() {
                    source.connection.endCalls();
                });
                target.connection.on('peer:couple', function() {
                    target.connection.endCalls();
                });

                setTimeout(function() {
                    t1.pass('No failure event raised');
                }, 1000);
            });
        });
    });
};