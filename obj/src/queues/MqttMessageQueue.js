"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let async = require('async');
const pip_services_messaging_node_1 = require("pip-services-messaging-node");
const pip_services_messaging_node_2 = require("pip-services-messaging-node");
const pip_services_messaging_node_3 = require("pip-services-messaging-node");
const MqttConnectionResolver_1 = require("../connect/MqttConnectionResolver");
class MqttMessageQueue extends pip_services_messaging_node_1.MessageQueue {
    constructor(name) {
        super(name);
        this._subscribed = false;
        this._optionsResolver = new MqttConnectionResolver_1.MqttConnectionResolver();
        this._capabilities = new pip_services_messaging_node_3.MessagingCapabilities(false, true, true, true, true, false, false, false, true);
    }
    isOpened() {
        return this._client != null;
    }
    openWithParams(correlationId, connection, credential, callback) {
        this._topic = connection.getAsString('topic');
        this._optionsResolver.compose(correlationId, connection, credential, (err, options) => {
            if (err) {
                callback(err);
                return;
            }
            let mqtt = require('mqtt');
            let client = mqtt.connect(options.uri, options);
            client.on('connect', () => {
                this._client = client;
                callback(null);
            });
            client.on('error', (err) => {
                callback(err);
            });
        });
    }
    close(correlationId, callback) {
        if (this._client != null) {
            this._messages = [];
            this._subscribed = false;
            this._receiver = null;
            this._client.end();
            this._client = null;
            this._logger.trace(correlationId, "Closed queue %s", this);
        }
        callback(null);
    }
    clear(correlationId, callback) {
        this._messages = [];
        callback();
    }
    readMessageCount(callback) {
        // Subscribe to get messages
        this.subscribe();
        let count = this._messages.length;
        callback(null, count);
    }
    send(correlationId, envelop, callback) {
        this._counters.incrementOne("queue." + this.getName() + ".sent_messages");
        this._logger.debug(envelop.correlation_id, "Sent message %s via %s", envelop.toString(), this.toString());
        this._client.publish(this._topic, envelop.message, callback);
    }
    peek(correlationId, callback) {
        // Subscribe to get messages
        this.subscribe();
        if (this._messages.length > 0)
            callback(null, this._messages[0]);
        else
            callback(null, null);
    }
    peekBatch(correlationId, messageCount, callback) {
        // Subscribe to get messages
        this.subscribe();
        callback(null, this._messages);
    }
    receive(correlationId, waitTimeout, callback) {
        let err = null;
        let message = null;
        let messageReceived = false;
        // Subscribe to get messages
        this.subscribe();
        // Return message immediately if it exist
        if (this._messages.length > 0) {
            message = this._messages.shift();
            callback(null, message);
            return;
        }
        // Otherwise wait and return
        let checkIntervalMs = 100;
        let i = 0;
        async.whilst(() => {
            return this._client && i < waitTimeout && message == null;
        }, (whilstCallback) => {
            i = i + checkIntervalMs;
            setTimeout(() => {
                message = this._messages.shift();
                whilstCallback();
            }, checkIntervalMs);
        }, (err) => {
            callback(err, message);
        });
    }
    renewLock(message, lockTimeout, callback) {
        // Not supported
        if (callback)
            callback(null);
    }
    complete(message, callback) {
        // Not supported
        if (callback)
            callback(null);
    }
    abandon(message, callback) {
        // Not supported
        if (callback)
            callback(null);
    }
    moveToDeadLetter(message, callback) {
        // Not supported
        if (callback)
            callback(null);
    }
    toMessage(topic, message, packet) {
        let envelop = new pip_services_messaging_node_2.MessageEnvelop(null, topic, message);
        envelop.message_id = packet.messageId;
        return envelop;
    }
    subscribe() {
        // Exit if already subscribed or 
        if (this._subscribed && this._client == null)
            return;
        this._logger.trace(null, "Started listening messages at %s", this.toString());
        this._client.on('message', (topic, message, packet) => {
            let envelop = this.toMessage(topic, message, packet);
            this._counters.incrementOne("queue." + this.getName() + ".received_messages");
            this._logger.debug(message.correlation_id, "Received message %s via %s", message, this.toString());
            if (this._receiver != null) {
                try {
                    this._receiver.receiveMessage(envelop, this, (err) => {
                        if (err)
                            this._logger.error(null, err, "Failed to receive the message");
                    });
                }
                catch (ex) {
                    this._logger.error(null, ex, "Failed to receive the message");
                }
            }
            else {
                // Keep message queue managable
                while (this._messages.length > 1000)
                    this._messages.shift();
                // Push into the message queue
                this._messages.push(envelop);
            }
        });
        // Subscribe to the topic
        this._client.subscribe(this._topic, (err) => {
            if (err)
                this._logger.error(null, err, "Failed to subscribe to topic " + this._topic);
        });
        this._subscribed = true;
    }
    listen(correlationId, receiver) {
        this._receiver = receiver;
        // Pass all cached messages
        async.whilst(() => {
            return this._messages.length > 0 && this._receiver != null;
        }, (whilstCallback) => {
            if (this._messages.length > 0 && this._receiver != null) {
                let message = this._messages.shift();
                receiver.receiveMessage(message, this, whilstCallback);
            }
            else
                whilstCallback();
        }, (err) => {
            // Subscribe to get messages
            this.subscribe();
        });
    }
    endListen(correlationId) {
        this._receiver = null;
        if (this._subscribed) {
            this._client.unsubscribe(this._topic);
            this._subscribed = false;
        }
    }
}
exports.MqttMessageQueue = MqttMessageQueue;
//# sourceMappingURL=MqttMessageQueue.js.map