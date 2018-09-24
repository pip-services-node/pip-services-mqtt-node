"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_commons_node_1 = require("pip-services-commons-node");
const MqttMessageQueue_1 = require("../queues/MqttMessageQueue");
/**
 * Creates [[MqttMessageQueue]] components by their descriptors.
 *
 * @see [[MqttMessageQueue]]
 */
class DefaultMqttFactory extends pip_services_components_node_1.Factory {
    /**
     * Create a new instance of the factory.
     */
    constructor() {
        super();
        this.register(DefaultMqttFactory.MqttQueueDescriptor, (locator) => {
            return new MqttMessageQueue_1.MqttMessageQueue(locator.getName());
        });
    }
}
DefaultMqttFactory.Descriptor = new pip_services_commons_node_1.Descriptor("pip-services", "factory", "mqtt", "default", "1.0");
DefaultMqttFactory.MqttQueueDescriptor = new pip_services_commons_node_1.Descriptor("pip-services", "message-queue", "mqtt", "*", "1.0");
exports.DefaultMqttFactory = DefaultMqttFactory;
//# sourceMappingURL=DefaultMqttFactory.js.map