import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { ConnectionResolver } from 'pip-services-components-node';
import { CredentialResolver } from 'pip-services-components-node';
import { ConnectionParams } from 'pip-services-components-node';
import { CredentialParams } from 'pip-services-components-node';
/**
 * Helper class that resolves MQTT connection and credential parameters,
 * validates them and generates connection options.
 *
 *  ### Configuration parameters ###
 *
 * connection(s):
 *   discovery_key:               (optional) a key to retrieve the connection from IDiscovery
 *   host:                        host name or IP address
 *   port:                        port number
 *   uri:                         resource URI or connection string with all parameters in it
 * credential(s):
 *   store_key:                   (optional) a key to retrieve the credentials from ICredentialStore
 *   username:                    user name
 *   password:                    user password
 *
 * ### References ###
 *
 * - *:discovery:*:*:1.0          (optional) IDiscovery services to resolve connections
 * - *:credential-store:*:*:1.0   (optional) Credential stores to resolve credentials
 */
export declare class MqttConnectionResolver implements IReferenceable, IConfigurable {
    /**
     * The connections resolver.
     */
    protected _connectionResolver: ConnectionResolver;
    /**
     * The credentials resolver.
     */
    protected _credentialResolver: CredentialResolver;
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config: ConfigParams): void;
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references: IReferences): void;
    private validateConnection;
    private composeOptions;
    /**
     * Resolves MQTT connection options from connection and credential parameters.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives resolved options or error.
     */
    resolve(correlationId: string, callback: (err: any, options: any) => void): void;
    /**
     * Composes MQTT connection options from connection and credential parameters.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param connection        connection parameters
     * @param credential        credential parameters
     * @param callback 			callback function that receives resolved options or error.
     */
    compose(correlationId: string, connection: ConnectionParams, credential: CredentialParams, callback: (err: any, options: any) => void): void;
}
