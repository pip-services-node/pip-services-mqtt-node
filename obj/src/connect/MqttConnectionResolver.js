"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let async = require('async');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
class MqttConnectionResolver {
    constructor() {
        this._connectionResolver = new pip_services_components_node_1.ConnectionResolver();
        this._credentialResolver = new pip_services_components_node_2.CredentialResolver();
    }
    setReferences(references) {
        this._connectionResolver.setReferences(references);
        this._credentialResolver.setReferences(references);
    }
    configure(config) {
        this._connectionResolver.configure(config);
        this._credentialResolver.configure(config);
    }
    validateConnection(correlationId, connection) {
        if (connection == null)
            return new pip_services_commons_node_1.ConfigException(correlationId, "NO_CONNECTION", "MQTT connection is not set");
        let uri = connection.getUri();
        if (uri != null)
            return null;
        let protocol = connection.getAsNullableString("protocol");
        if (protocol == null)
            return new pip_services_commons_node_1.ConfigException(correlationId, "NO_PROTOCOL", "Connection protocol is not set");
        let host = connection.getHost();
        if (host == null)
            return new pip_services_commons_node_1.ConfigException(correlationId, "NO_HOST", "Connection host is not set");
        let port = connection.getPort();
        if (port == 0)
            return new pip_services_commons_node_1.ConfigException(correlationId, "NO_PORT", "Connection port is not set");
        return null;
    }
    composeOptions(connection, credential) {
        // Define additional parameters parameters
        let options = connection.override(credential).getAsObject();
        // Compose uri
        if (options.uri == null) {
            options.uri = options.protocol + "://" + options.host;
            if (options.port)
                options.uri += ':' + options.port;
        }
        return options;
    }
    resolve(correlationId, callback) {
        let connection;
        let credential;
        async.parallel([
            (callback) => {
                this._connectionResolver.resolve(correlationId, (err, result) => {
                    connection = result;
                    // Validate connections
                    if (err == null)
                        err = this.validateConnection(correlationId, connection);
                    callback(err);
                });
            },
            (callback) => {
                this._credentialResolver.lookup(correlationId, (err, result) => {
                    credential = result;
                    // Credentials are not validated right now
                    callback(err);
                });
            }
        ], (err) => {
            if (err)
                callback(err, null);
            else {
                let options = this.composeOptions(connection, credential);
                callback(null, options);
            }
        });
    }
    compose(correlationId, connection, credential, callback) {
        // Validate connections
        let err = this.validateConnection(correlationId, connection);
        if (err)
            callback(err, null);
        else {
            let options = this.composeOptions(connection, credential);
            callback(null, options);
        }
    }
}
exports.MqttConnectionResolver = MqttConnectionResolver;
//# sourceMappingURL=MqttConnectionResolver.js.map