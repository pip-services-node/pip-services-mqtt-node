import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { ConnectionResolver } from 'pip-services-components-node';
import { CredentialResolver } from 'pip-services-components-node';
import { ConnectionParams } from 'pip-services-components-node';
import { CredentialParams } from 'pip-services-components-node';
export declare class MqttConnectionResolver implements IReferenceable, IConfigurable {
    protected _connectionResolver: ConnectionResolver;
    protected _credentialResolver: CredentialResolver;
    setReferences(references: IReferences): void;
    configure(config: ConfigParams): void;
    private validateConnection;
    private composeOptions;
    resolve(correlationId: string, callback: (err: any, options: any) => void): void;
    compose(correlationId: string, connection: ConnectionParams, credential: CredentialParams, callback: (err: any, options: any) => void): void;
}
