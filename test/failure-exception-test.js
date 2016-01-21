var test = require('tape');
var async = require('async');
var peerHelper = require('./helpers/peer');

module.exports = function(signallingServer) {

    var room = 'rtchealth-ut-' + require('uuid').v4();

    var newPeer = peerHelper.peerCreator(signallingServer, {
        room: room,
        manualJoin: true,
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

    test('failure does not get reported if call is terminated prior to connection', {timeout: 30000}, function(t) {
        var createPeer = newPeer.bind(newPeer, t);
        async.parallel([createPeer, createPeer], function(err, peers) {
            t.ok(peers.length === 2, 'two peers created');

            t.test('termination', function(t1) {
                t1.plan(8);
                var source = peers[0];
                var target = peers[1];
                var sourceCreated = false;
                var targetCreated = false;

                function failOnFailure(tc, err) {
                    t1.fail('A health connection failure was detected [' + err + ']');
                }

                function terminateOnCreate() {
                    if (!sourceCreated || !targetCreated) return setTimeout(terminateOnCreate, 0);
                    source.connection.endCalls();
                    target.connection.endCalls();
                }

                source.monitor.on('health:connection:failure', failOnFailure);
                target.monitor.on('health:connection:failure', failOnFailure);

                source.connection.on('call:started', t1.fail.bind(t1, 'Source call started'));
                target.connection.on('call:started', t1.fail.bind(t1, 'Target call started'));

                source.connection.on('call:failed', t1.fail.bind(t1, 'Source call failed'));
                source.connection.on('call:ended', t1.pass.bind(t1, 'Source call was ended'));
                target.connection.on('call:ended', t1.pass.bind(t1, 'Target call was ended'));

                source.connection.on('call:created', t1.pass.bind(t1, 'Source call created'));
                target.connection.on('call:created', t1.pass.bind(t1, 'Target call created'));

                source.connection.on('call:created', function() {
                    t1.pass('source has been created');
                    sourceCreated = true;

                });
                target.connection.on('call:created', function() {
                    t1.pass('target has been created');
                    targetCreated = true;
                });

                terminateOnCreate();
                source.connection.join();
                target.connection.join();
                t1.pass('Connection joining');

                setTimeout(function() {
                    t1.pass('No failure event raised');
                }, 1000);
            });
        });
    });
};