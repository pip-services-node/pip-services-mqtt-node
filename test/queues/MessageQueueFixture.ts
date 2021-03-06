let assert = require('chai').assert;
let async = require('async');

import { IMessageQueue } from 'pip-services-messaging-node';
import { MessageEnvelop } from 'pip-services-messaging-node';

export class MessageQueueFixture {
    private _queue: IMessageQueue;

    public constructor(queue: IMessageQueue) {
        this._queue = queue;
    }

    public testSendReceiveMessage(done) {
        let envelop1: MessageEnvelop = new MessageEnvelop("123", "Test", "Test message");
        let envelop2: MessageEnvelop;

        async.series([
            (callback) => {
                this._queue.send(null, envelop1, callback);
            },
            (callback) => {
                var count = this._queue.readMessageCount((err, count) => {
                    assert.isTrue(count > 0);
                    callback(err);
                });
            },
            (callback) => {
                this._queue.receive(null, 10000, (err, result) => {
                    envelop2 = result;

                    assert.isNotNull(envelop2);
                    assert.equal(envelop1.message_type, envelop2.message_type);
                    assert.equal(envelop1.message, envelop2.message);
                    assert.equal(envelop1.correlation_id, envelop2.correlation_id);

                    callback(err);
                });
            }
        ], done);
    }

    public testReceiveSendMessage(done) {
        let envelop1: MessageEnvelop = new MessageEnvelop("123", "Test", "Test message");
        let envelop2: MessageEnvelop;

        setTimeout(() => {
            this._queue.send(null, envelop1, () => { });
        }, 500);

        this._queue.receive(null, 10000, (err, result) => {
            envelop2 = result;

            assert.isNotNull(envelop2);
            assert.equal(envelop1.message_type, envelop2.message_type);
            assert.equal(envelop1.message, envelop2.message);
            assert.equal(envelop1.correlation_id, envelop2.correlation_id);

            done(err);
        });
    }

    public testReceiveCompleteMessage(done) {
        let envelop1: MessageEnvelop = new MessageEnvelop("123", "Test", "Test message");
        let envelop2: MessageEnvelop;

        async.series([
            (callback) => {
                this._queue.send(null, envelop1, callback);
            },
            (callback) => {
                var count = this._queue.readMessageCount((err, count) => {
                    assert.isTrue(count > 0);
                    callback(err);
                });
            },
            (callback) => {
                this._queue.receive(null, 10000, (err, result) => {
                    envelop2 = result;

                    assert.isNotNull(envelop2);
                    assert.equal(envelop1.message_type, envelop2.message_type);
                    assert.equal(envelop1.message, envelop2.message);
                    assert.equal(envelop1.correlation_id, envelop2.correlation_id);

                    callback(err);
                });
            },
            (callback) => {
                this._queue.complete(envelop2, (err) => {
                    assert.isNull(envelop2.getReference());
                    callback(err);
                });
            }
        ], done);
    }

    public testReceiveAbandonMessage(done) {
        let envelop1: MessageEnvelop = new MessageEnvelop("123", "Test", "Test message");
        let envelop2: MessageEnvelop;

        async.series([
            (callback) => {
                this._queue.send(null, envelop1, callback);
            },
            (callback) => {
                this._queue.receive(null, 10000, (err, result) => {
                    envelop2 = result;

                    assert.isNotNull(envelop2);
                    assert.equal(envelop1.message_type, envelop2.message_type);
                    assert.equal(envelop1.message, envelop2.message);
                    assert.equal(envelop1.correlation_id, envelop2.correlation_id);

                    callback(err);
                });
            },
            (callback) => {
                this._queue.abandon(envelop2, (err) => {
                    callback(err);
                });
            },
            (callback) => {
                this._queue.receive(null, 10000, (err, result) => {
                    envelop2 = result;

                    assert.isNotNull(envelop2);
                    assert.equal(envelop1.message_type, envelop2.message_type);
                    assert.equal(envelop1.message, envelop2.message);
                    assert.equal(envelop1.correlation_id, envelop2.correlation_id);

                    callback(err);
                });
            }
        ], done);
    }

    public testSendPeekMessage(done) {
        let envelop1: MessageEnvelop = new MessageEnvelop("123", "Test", "Test message");
        let envelop2: MessageEnvelop;

        async.series([
            (callback) => {
                this._queue.send(null, envelop1, callback);
            },
            (callback) => {
                this._queue.peek(null, (err, result) => {
                    envelop2 = result;

                    assert.isNotNull(envelop2);
                    assert.equal(envelop1.message_type, envelop2.message_type);
                    assert.equal(envelop1.message, envelop2.message);
                    assert.equal(envelop1.correlation_id, envelop2.correlation_id);

                    callback(err);
                });
            }
        ], done);
    }

    public testPeekNoMessage(done) {
        this._queue.peek(null, (err, result) => {
            assert.isNull(result);
            done();
        });
    }

    public testMoveToDeadMessage(done) {
        let envelop1: MessageEnvelop = new MessageEnvelop("123", "Test", "Test message");
        let envelop2: MessageEnvelop;

        async.series([
            (callback) => {
                this._queue.send(null, envelop1, callback);
            },
            (callback) => {
                this._queue.receive(null, 10000, (err, result) => {
                    envelop2 = result;

                    assert.isNotNull(envelop2);
                    assert.equal(envelop1.message_type, envelop2.message_type);
                    assert.equal(envelop1.message, envelop2.message);
                    assert.equal(envelop1.correlation_id, envelop2.correlation_id);

                    callback(err);
                });
            },
            (callback) => {
                this._queue.moveToDeadLetter(envelop2, callback);
            }
        ], done);
    }

    public testOnMessage(done) {
        let envelop1: MessageEnvelop = new MessageEnvelop("123", "Test", "Test message");
        let envelop2: MessageEnvelop = null;

        this._queue.beginListen(null, {
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
                this._queue.send(null, envelop1, callback);
            },
            (callback) => {
                setTimeout(() => {
                    callback();
                }, 1000);
            },
            (callback) => {
                assert.isNotNull(envelop2);
                assert.equal(envelop1.message_type, envelop2.message_type);
                assert.equal(envelop1.message, envelop2.message);
                assert.equal(envelop1.correlation_id, envelop2.correlation_id);

                callback();
            }
        ], (err) => {
            this._queue.endListen(null);
            done();
        });
    }

}
