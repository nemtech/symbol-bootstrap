/*
 * Copyright 2020 NEM
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

import { NetworkType } from 'symbol-sdk';
import { VotingKeyFile } from '../service';

export interface CertificatePair {
    privateKey?: string;
    publicKey: string;
}

export interface ConfigAccount extends CertificatePair {
    address: string;
}

export interface NodeAccount {
    // keys from ca.cert.pem file
    main: ConfigAccount;
    // keys from the node.key.pem file (required for delegate harvesting)
    transport: ConfigAccount;
    // Harvester signing key is produced if node is peer or voting.
    // It could be the ca/main account or a linked remote account. The later is recommended.
    remote?: ConfigAccount;
    // VRF key is produced if node is peer
    vrf?: ConfigAccount;
    // Voting keys are produced if node is voting
    voting?: VotingKeyFile[];
    // Agent private key is produced if node is supernode
    agent?: ConfigAccount;
    roles: string;
    name: string;
    friendlyName: string;
}

export interface MosaicAccounts {
    name: string;
    id: string;
    accounts: ConfigAccount[];
}

export interface Addresses {
    version: number;
    nodes?: NodeAccount[];
    nemesisGenerationHashSeed: string;
    sinkAddress?: string;
    nemesisSigner?: ConfigAccount;
    networkType: NetworkType;
    mosaics?: MosaicAccounts[];
}
