let async = require('async');

import { ConnectionParams } from 'pip-services-components-node';
import { CredentialParams } from 'pip-services-components-node';

import { IMessageReceiver } from 'pip-services-messaging-node';
import { MessageQueue } from 'pip-services-messaging-node';
import { MessageEnvelop } from 'pip-services-messaging-node';
import { MessagingCapabilities } from 'pip-services-messaging-node';

import { MqttConnectionResolver } from '../connect/MqttConnectionResolver';

export class MqttMessageQueue extends MessageQueue {
    private _client: any;
    private _topic: string;
    private _subscribed: boolean = false;
    private _optionsResolver: MqttConnectionResolver = new MqttConnectionResolver();
    private _receiver: IMessageReceiver;
    private _messages: MessageEnvelop[];

    public constructor(name?: string) {
        super(name);
        this._capabilities = new MessagingCapabilities(false, true, true, true, true, false, false, false, true);
    }

    public isOpened(): boolean {
        return this._client != null;
    }

    protected openWithParams(correlationId: string, connection: ConnectionParams, credential: CredentialParams, callback: (err: any) => void): void {
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

    public close(correlationId: string, callback: (err: any) => void): void {
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

    public clear(correlationId: string, callback: (err?: any) => void): void {
        this._messages = [];
        callback();
    }

    public readMessageCount(callback: (err: any, count: number) => void): void {
        // Subscribe to get messages
        this.subscribe();

        let count = this._messages.length;
        callback(null, count);
    }

    public send(correlationId: string, envelop: MessageEnvelop, callback?: (err: any) => void): void {
        this._counters.incrementOne("queue." + this.getName() + ".sent_messages");
        this._logger.debug(envelop.correlation_id, "Sent message %s via %s", envelop.toString(), this.toString());

        this._client.publish(this._topic, envelop.message, callback);
    }

    public peek(correlationId: string, callback: (err: any, result: MessageEnvelop) => void): void {
        // Subscribe to get messages
        this.subscribe();

        if (this._messages.length > 0)
            callback(null, this._messages[0]);
        else callback(null, null);
    }

    public peekBatch(correlationId: string, messageCount: number, callback: (err: any, result: MessageEnvelop[]) => void): void {
        // Subscribe to get messages
        this.subscribe();

        callback(null, this._messages);
    }

    public receive(correlationId: string, waitTimeout: number, callback: (err: any, result: MessageEnvelop) => void): void {
        let err: any = null;
        let message: MessageEnvelop = null;
        let messageReceived: boolean = false;

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
        async.whilst(
            () => {
                return this._client && i < waitTimeout && message == null;
            },
            (whilstCallback) => {
                i = i + checkIntervalMs;

                setTimeout(() => {
                    message = this._messages.shift();
                    whilstCallback();
                }, checkIntervalMs);
            },
            (err) => {
                callback(err, message);
            }
        );
    }

    public renewLock(message: MessageEnvelop, lockTimeout: number, callback?: (err: any) => void): void {
        // Not supported
        if (callback) callback(null);
    }

    public complete(message: MessageEnvelop, callback: (err: any) => void): void {
        // Not supported
        if (callback) callback(null);
    }

    public abandon(message: MessageEnvelop, callback: (err: any) => void): void {
        // Not supported
        if (callback) callback(null);
    }

    public moveToDeadLetter(message: MessageEnvelop, callback: (err: any) => void): void {
        // Not supported
        if (callback) callback(null);
    }

    private toMessage(topic: string, message: any, packet: any): MessageEnvelop {
        let envelop = new MessageEnvelop(null, topic, message);
        envelop.message_id = packet.messageId;
        return envelop;
    }

    protected subscribe(): void {
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
                        if (err) this._logger.error(null, err, "Failed to receive the message");
                    });
                } catch (ex) {
                    this._logger.error(null, ex, "Failed to receive the message");
                }
            } else {
                // Keep message queue managable
                while (this._messages.length > 1000)
                    this._messages.shift();
                    
                // Push into the message queue
                this._messages.push(envelop);
            }
        });

        // Subscribe to the topic
        this._client.subscribe(this._topic, (err) => {
            if (err) this._logger.error(null, err, "Failed to subscribe to topic " + this._topic);
        });
        this._subscribed = true;
    }

    public listen(correlationId: string, receiver: IMessageReceiver): void {
        this._receiver = receiver;

        // Pass all cached messages
        async.whilst(
            () => {
                return this._messages.length > 0 && this._receiver != null;
            },
            (whilstCallback) => {
                if (this._messages.length > 0 && this._receiver != null) {
                    let message = this._messages.shift();
                    receiver.receiveMessage(message, this, whilstCallback);
                } else whilstCallback();
            },
            (err) => {
                // Subscribe to get messages
                this.subscribe();
            }
        );
    }

    public endListen(correlationId: string): void {
        this._receiver = null;

        if (this._subscribed) {
            this._client.unsubscribe(this._topic);
            this._subscribed = false;
        }
    }

}