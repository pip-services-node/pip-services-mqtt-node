let async = require('async');

import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { ConfigException } from 'pip-services-commons-node';
import { ConnectionResolver } from 'pip-services-components-node';
import { CredentialResolver } from 'pip-services-components-node';
import { ConnectionParams } from 'pip-services-components-node';
import { CredentialParams } from 'pip-services-components-node';

export class MqttConnectionResolver implements IReferenceable, IConfigurable {
    protected _connectionResolver: ConnectionResolver = new ConnectionResolver();
    protected _credentialResolver: CredentialResolver = new CredentialResolver();

    public setReferences(references: IReferences): void {
        this._connectionResolver.setReferences(references);
        this._credentialResolver.setReferences(references);
    }

    public configure(config: ConfigParams): void {
        this._connectionResolver.configure(config);
        this._credentialResolver.configure(config);
    }

    private validateConnection(correlationId: string, connection: ConnectionParams): any {
        if (connection == null)
            return new ConfigException(correlationId, "NO_CONNECTION", "MQTT connection is not set");

        let uri = connection.getUri();
        if (uri != null) return null;

        let protocol = connection.getAsNullableString("protocol");
        if (protocol == null)
            return new ConfigException(correlationId, "NO_PROTOCOL", "Connection protocol is not set");

        let host = connection.getHost();
        if (host == null)
            return new ConfigException(correlationId, "NO_HOST", "Connection host is not set");

        let port = connection.getPort();
        if (port == 0)
            return new ConfigException(correlationId, "NO_PORT", "Connection port is not set");

        return null;
    }

    private composeOptions(connection: ConnectionParams, credential: CredentialParams): any {
        // Define additional parameters parameters
        let options: any = connection.override(credential).getAsObject();

        // Compose uri
        if (options.uri == null) {
            options.uri = options.protocol + "://" + options.host;
            if (options.port)
                options.uri += ':' + options.port;
        }

        return options;
    }

    public resolve(correlationId: string, callback: (err: any, options: any) => void): void {
        let connection: ConnectionParams;
        let credential: CredentialParams;

        async.parallel([
            (callback) => {
                this._connectionResolver.resolve(correlationId, (err: any, result: ConnectionParams) => {
                    connection = result;

                    // Validate connections
                    if (err == null)
                        err = this.validateConnection(correlationId, connection);

                    callback(err);
                });
            },
            (callback) => {
                this._credentialResolver.lookup(correlationId, (err: any, result: CredentialParams) => {
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

    public compose(correlationId: string, connection: ConnectionParams, credential: CredentialParams,
        callback: (err: any, options: any) => void): void {

        // Validate connections
        let err = this.validateConnection(correlationId, connection);
        if (err) callback(err, null);
        else {
            let options = this.composeOptions(connection, credential);
            callback(null, options);
        }
    }
}
