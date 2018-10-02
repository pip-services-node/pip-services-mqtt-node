/** @module build */
import { Factory } from 'pip-services-components-node';
import { Descriptor } from 'pip-services-commons-node';
/**
 * Creates [[MqttMessageQueue]] components by their descriptors.
 *
 * @see [[MqttMessageQueue]]
 */
export declare class DefaultMqttFactory extends Factory {
    static readonly Descriptor: Descriptor;
    static readonly MqttQueueDescriptor: Descriptor;
    /**
     * Create a new instance of the factory.
     */
    constructor();
}
