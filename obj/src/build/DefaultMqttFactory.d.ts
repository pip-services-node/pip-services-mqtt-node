import { Factory } from 'pip-services-components-node';
import { Descriptor } from 'pip-services-commons-node';
export declare class DefaultMqttFactory extends Factory {
    static readonly Descriptor: Descriptor;
    static readonly MqttQueueDescriptor: Descriptor;
    constructor();
}
