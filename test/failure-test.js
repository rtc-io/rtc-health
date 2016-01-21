var test = require('tape');
var async = require('async');
var peerHelper = require('./helpers/peer');
var Promise = require('es6-promise').Promise;

// require('cog/logger').enable('*');
module.exports = function(signallingServer) {

    var room = 'rtchealth-ut-' + require('uuid').v4();

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
            connectionFailureTime: 100,
        },
    });

    test('failure tracking', function(t) {

        var createPeer = newPeer.bind(newPeer, t);
        async.parallel([createPeer, createPeer], function(err, peers) {

            t.ok(peers.length === 2, 'two peers created');

            var source = peers[0];
            var target = peers[1];

            var firstSourceFailure = new Promise(function(resolve, reject) {
                // We fulfil the promise only if the connection failure is noticed.
                source.monitor.on('health:connection:failure', function(tc) {
                    resolve(tc);
                });

                // Timeout to keep the test from stalling for too long in
                // unexpected conditions.
                setTimeout(function() {
                    reject();
                }, 2000);
            });

            t.test('track connection failure', function(t) {
                firstSourceFailure.then(function() {
                    t.pass('connection failure was caught');
                    t.end();
                }, function() {
                    t.fail('connection failure was not caught');
                    t.end();
                });
            });
        });
    });
};
