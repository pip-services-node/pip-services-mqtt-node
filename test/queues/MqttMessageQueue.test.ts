let assert = require('chai').assert;
let async = require('async');
let process = require('process');

import { ConfigParams } from 'pip-services-commons-node';

import { IMessageQueue } from 'pip-services-messaging-node';
import { MessageEnvelop } from 'pip-services-messaging-node';

import { MessageQueueFixture } from './MessageQueueFixture';
import { MqttMessageQueue } from '../../src/queues/MqttMessageQueue';

suite('MqttMessageQueue', ()=> {
    let queue: MqttMessageQueue;
    let fixture: MessageQueueFixture;

    let brokerHost = process.env['MOSQUITTO_HOST'] || 'localhost';
    let brokerPort = process.env['MOSQUITTO_PORT'] || 1883;
    let brokerTopic = process.env['MOSQUITTO_TOPIC'] || '/test';
    if (brokerHost == '' && brokerPort == '')
        return;
    
    let queueConfig = ConfigParams.fromTuples(
        'connection.protocol', 'mqtt',
        'connection.host', brokerHost,
        'connection.port', brokerPort,
        'connection.topic', brokerTopic
    );

    setup((done) => {
        queue = new MqttMessageQueue();
        queue.configure(queueConfig);

        fixture = new MessageQueueFixture(queue);

        queue.open(null, (err: any) => {
            queue.clear(null, (err) => {
                done(err);
            });
        });
    });

    teardown((done) => {
        queue.close(null, done);
    });

    test('Receive and Send Message', (done) => {
        let envelop1: MessageEnvelop = new MessageEnvelop("123", "Test", "Test message");
        let envelop2: MessageEnvelop;

        setTimeout(() => {
            queue.send(null, envelop1, () => { });
        }, 500);

        queue.receive(null, 10000, (err, result) => {
            envelop2 = result;

            assert.isNotNull(envelop2);
            assert.isNotNull(envelop1.message);
            assert.isNotNull(envelop2.message);
            assert.equal(envelop1.message.toString(), envelop2.message.toString());
            
            done(err);
        });
    });

    test('On Message', (done) => {
        let envelop1: MessageEnvelop = new MessageEnvelop("123", "Test", "Test message");
        let envelop2: MessageEnvelop = null;

        queue.beginListen(null, {
            receiveMessage: (envelop: MessageEnvelop, queue: IMessageQueue, callback: (err: any) => void): void => {
                envelop2 = envelop;
                callback(null);
            }
        });

        async.series([
            (callback) => {
                setTimeout(() => {
                    callback();
                }, 1000);
            },
            (callback) => {
                queue.send(null, envelop1, callback);
            },
            (callback) => {
                setTimeout(() => {
                    callback();
                }, 1000);
            },
            (callback) => {
                assert.isNotNull(envelop2);

                assert.isNotNull(envelop1.message);
                assert.isNotNull(envelop2.message);
                assert.equal(envelop1.message.toString(), envelop2.message.toString());

                callback();
            }
        ], (err) => {
            queue.endListen(null);
            done();
        });
    });

});