/*
 * Copyright 2021 NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CustomPreset, NodeAccount as NodeAddresses } from 'symbol-bootstrap-core';

export enum NodeMetadataType {
    VotingPeer = 'VotingPeer',
    VotingApi = 'VotingApi',
    VotingDual = 'VotingDual',
    HarvestingPeer = 'HarvestingPeer',
    HarvestingDual = 'HarvestingDual',
    HarvestingDemo = 'HarvestingDemo',
    VotingNonHarvestingPeer = 'VotingNonHarvestingPeer',
    Peer = 'Peer',
    Api = 'Api',
}

export class NodeMetadataUtils {
    public static getAssembly(metadata: NodeTypeMetadata): string {
        if (metadata.assembly) {
            return metadata.assembly;
        }
        return metadata.api && metadata.peer ? 'dual' : metadata.api ? 'api' : 'peer';
    }
}

export interface NodeTypeMetadata {
    name: string;
    balances: number[];
    api: boolean;
    peer: boolean;
    harvesting: boolean;
    voting: boolean;
    demo: boolean;
    nickName: string;
    assembly?: string;
}

export const nodesMetadata: Record<NodeMetadataType, NodeTypeMetadata> = {
    VotingPeer: {
        name: 'Voting Peer',
        balances: [3_000_000, 150],
        voting: true,
        harvesting: true,
        demo: false,
        api: false,
        peer: true,
        nickName: 'beacon',
    },
    VotingApi: {
        name: 'Voting Api',
        balances: [3_000_000, 150],
        voting: true,
        harvesting: true,
        demo: false,
        api: false,
        peer: true,
        nickName: 'beacon',
    },
    VotingDual: {
        name: 'Voting Dual',
        balances: [3_000_000, 150],
        voting: true,
        harvesting: true,
        demo: false,
        api: true,
        peer: true,
        nickName: 'dual',
    },
    HarvestingPeer: {
        name: 'Harvesting Peer',
        balances: [1_000_000, 150],
        voting: false,
        harvesting: true,
        demo: false,
        api: false,
        peer: true,
        nickName: 'beacon',
    },
    HarvestingDual: {
        name: 'Harvesting Dual',
        balances: [1_000_000, 150],
        voting: false,
        harvesting: true,
        demo: false,
        api: true,
        peer: true,
        nickName: 'dual',
    },

    HarvestingDemo: {
        name: 'Harvesting Demo',
        balances: [1_000_000, 150],
        voting: false,
        harvesting: true,
        demo: true,
        api: true,
        peer: true,
        assembly: 'demo',
        nickName: 'demo',
    },
    Peer: {
        name: 'Peer',
        balances: [1_000, 0],
        voting: false,
        harvesting: false,
        demo: false,
        api: false,
        peer: true,
        nickName: 'peer',
    },
    Api: {
        name: 'Api',
        balances: [1_000, 0],
        voting: false,
        harvesting: false,
        demo: false,
        api: true,
        peer: false,
        nickName: 'api',
    },
    VotingNonHarvestingPeer: {
        name: 'Non Harvesting Voting Peer',
        balances: [51_000_000, 0],
        voting: true,
        harvesting: false,
        demo: false,
        api: false,
        peer: true,
        nickName: 'peer',
    },
};

export interface NodeAccount {
    privateKey: string;
    publicKey: string;
    address: string;
}

export interface PublicNodeAccount {
    publicKey: string;
    address: string;
}

export interface NodeInformation {
    number: number;
    nickName: string;
    friendlyName: string;
    assembly: string;
    hostname: string;
    nodeType: NodeMetadataType;
    balances: number[];
    addresses?: NodeAddresses;
    customPreset?: CustomPreset;
}
