import { NodeInformation, NodeMetadataType } from '../../model/NodeInformation';

export type AwsRootBlockSize = number;
export enum AwsNodeSize {
    xlarge = 't3.xlarge',
    large = 't3.large',
}

export enum Region {
    'us-east-1' = 'us-east-1',
    'us-west-1' = 'us-west-1',
    'us-west-2' = 'us-west-2',
    'eu-west-1' = 'eu-west-1',
    'eu-central-1' = 'eu-central-1',
    'ap-northeast-1' = 'ap-northeast-1',
    'ap-southeast-1' = 'ap-southeast-1',
}

export const regions: Region[] = Object.keys(Region) as Region[];

export interface AwsNodeMetadata {
    nodeSize: AwsNodeSize;
    rootBlockSize: AwsRootBlockSize;
}

export interface AwsNodeData extends AwsNodeMetadata, NodeInformation {
    region: Region;
}

export const nodesAwsMetadata: Record<NodeMetadataType, AwsNodeMetadata> = {
    VotingPeer: {
        nodeSize: AwsNodeSize.xlarge,
        rootBlockSize: 250,
    },
    VotingApi: {
        nodeSize: AwsNodeSize.xlarge,
        rootBlockSize: 250,
    },
    VotingDual: {
        nodeSize: AwsNodeSize.xlarge,
        rootBlockSize: 500,
    },
    HarvestingPeer: {
        nodeSize: AwsNodeSize.xlarge,
        rootBlockSize: 500,
    },
    HarvestingDual: {
        nodeSize: AwsNodeSize.xlarge,
        rootBlockSize: 750,
    },
    HarvestingDemo: {
        nodeSize: AwsNodeSize.xlarge,
        rootBlockSize: 750,
    },
    Peer: {
        nodeSize: AwsNodeSize.large,
        rootBlockSize: 250,
    },
    Api: {
        nodeSize: AwsNodeSize.xlarge,
        rootBlockSize: 750,
    },
    VotingNonHarvestingPeer: {
        nodeSize: AwsNodeSize.large,
        rootBlockSize: 250,
    },
};
