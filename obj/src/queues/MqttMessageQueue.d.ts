import { ConnectionParams } from 'pip-services-components-node';
import { CredentialParams } from 'pip-services-components-node';
import { IMessageReceiver } from 'pip-services-messaging-node';
import { MessageQueue } from 'pip-services-messaging-node';
import { MessageEnvelop } from 'pip-services-messaging-node';
export declare class MqttMessageQueue extends MessageQueue {
    private _client;
    private _topic;
    private _subscribed;
    private _optionsResolver;
    private _receiver;
    private _messages;
    constructor(name?: string);
    isOpen(): boolean;
    protected openWithParams(correlationId: string, connection: ConnectionParams, credential: CredentialParams, callback: (err: any) => void): void;
    close(correlationId: string, callback: (err: any) => void): void;
    clear(correlationId: string, callback: (err?: any) => void): void;
    readMessageCount(callback: (err: any, count: number) => void): void;
    send(correlationId: string, envelop: MessageEnvelop, callback?: (err: any) => void): void;
    peek(correlationId: string, callback: (err: any, result: MessageEnvelop) => void): void;
    peekBatch(correlationId: string, messageCount: number, callback: (err: any, result: MessageEnvelop[]) => void): void;
    receive(correlationId: string, waitTimeout: number, callback: (err: any, result: MessageEnvelop) => void): void;
    renewLock(message: MessageEnvelop, lockTimeout: number, callback?: (err: any) => void): void;
    complete(message: MessageEnvelop, callback: (err: any) => void): void;
    abandon(message: MessageEnvelop, callback: (err: any) => void): void;
    moveToDeadLetter(message: MessageEnvelop, callback: (err: any) => void): void;
    private toMessage;
    protected subscribe(): void;
    listen(correlationId: string, receiver: IMessageReceiver): void;
    endListen(correlationId: string): void;
}
