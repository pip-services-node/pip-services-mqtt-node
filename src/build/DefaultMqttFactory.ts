import { Factory } from 'pip-services-components-node';
import { Descriptor } from 'pip-services-commons-node';

import { MqttMessageQueue } from '../queues/MqttMessageQueue';

export class DefaultMqttFactory extends Factory {
	public static readonly Descriptor = new Descriptor("pip-services", "factory", "mqtt", "default", "1.0");
    public static readonly MqttQueueDescriptor: Descriptor = new Descriptor("pip-services", "message-queue", "mqtt", "*", "1.0");

	public constructor() {
        super();
        this.register(DefaultMqttFactory.MqttQueueDescriptor, (locator: Descriptor) => {
            return new MqttMessageQueue(locator.getName());
        });
	}
}