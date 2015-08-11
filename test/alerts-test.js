var test = require('tape');
var room = 'rtchealth-ut-' + require('uuid').v4();
var peerHelper = require('./helpers/peer');
var alerter = require('../alerts');
var threshold = require('../alerts/threshold');

module.exports = function(signallingServer) {

    var newPeer = peerHelper.peerCreator(signallingServer, {room: room, monitorOpts: { pollInterval: 1000 } });

    test('rtc-health alerts', function(t) {
        newPeer(t, function(err, peer) {

            var alerts = alerter(peer.monitor);

            t.test('can add a threshold warning', function(t) {
                t.plan(3);
                var lowSendBandwidth = threshold('videoBwe', 'availableSendBandwidth', {
                    threshold: 1e6,  // Mbit/s
                    period: 10*1000 // ms
                });            
                alerts.addAlert('bandwidth:valid', lowSendBandwidth);
                var globalAlerts = alerts.getAlerts();
                t.equal(globalAlerts.videoBwe.length, 1, 'appropriate amounts of alerts');
                var thisAlert = globalAlerts.videoBwe[0];
                t.equal(thisAlert.name, 'bandwidth:valid', 'alert is named');
                t.equal(thisAlert.active, true, 'alert is active');
            });

            t.test('adding a threshold which fails to pass initialization', function(t) {
                t.plan(3);
                var lowSendBandwidth = threshold('videoBwe', 'availableSendBandwidth', {
                    threshold: 1e6,  // Mbit/s
                    period: 1000 // ms
                });            
                alerts.addAlert('bandwidth:invalid', lowSendBandwidth);
                var globalAlerts = alerts.getAlerts();
                t.equal(globalAlerts.videoBwe.length, 2, 'appropriate amounts of alerts');
                var thisAlert = globalAlerts.videoBwe[1];
                t.equal(thisAlert.name, 'bandwidth:invalid', 'alert is named');
                t.equal(thisAlert.active, false, 'alert is inactive');
            });
        });
    });
}