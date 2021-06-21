import { DeploymentData } from '../../model';

export interface AwsDeploymentData extends DeploymentData {
    bucketName?: string;
    bucketFolder: string;
    secretIdPrefix: string;
    masterRegion: string;
}
