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

import { existsSync } from 'fs';
import { BootstrapUtils, KeyName, VotingKeyAccount, VotingUtils } from 'symbol-bootstrap-core';
import { Account, NetworkType } from 'symbol-sdk';
import { NodeInformation } from '../model';
import { NetworkUtils } from './NetworkUtils';

export type VotingKeyFileContent = VotingKeyAccount & {
    fileContent: Uint8Array;
};

export type NetworkAccountName =
    | 'founder'
    | 'faucet'
    | 'nemesisSigner'
    | 'harvestNetworkFeeSink'
    | 'mosaicRentalFeeSink'
    | 'namespaceRentalFeeSink'
    | 'rewardProgramEnrollment';

export interface AccountStorage {
    getNodeAccount(networkType: NetworkType, keyName: KeyName, nodeInformation: NodeInformation): Promise<Account>;

    getVotingKeyFile(
        networkType: NetworkType,
        nodeInformation: NodeInformation,
        startEpoch: number,
        endEpoch: number,
    ): Promise<VotingKeyFileContent>;

    getNetworkAccount(networkType: NetworkType, accountName: NetworkAccountName): Promise<Account>;
    getNetworkAccountIfExists(networkType: NetworkType, accountName: NetworkAccountName): Promise<Account | undefined>;

    saveNetworkAccount(networkType: NetworkType, accountName: NetworkAccountName, privateKey: string): Promise<void>;
}

export interface StoredAccount {
    privateKey: string;
    publicKey: string;
    address: string;
}

export interface AccountStore {
    network: Partial<Record<NetworkAccountName, StoredAccount>>;
    nodes: Record<string, Record<KeyName, StoredAccount>>;
    votingFiles: Record<string, string>;
}

export class LocalFileAccountStorage implements AccountStorage {
    private readonly storage: AccountStore;
    constructor(private readonly password: string | undefined, private readonly storageFile = NetworkUtils.DEFAULT_LOCAL_STORAGE) {
        const defaultValue = { nodes: {}, network: {}, votingFiles: {} };
        const storedValue = existsSync(storageFile) ? (BootstrapUtils.loadYaml(storageFile, password) as AccountStore) : {};
        this.storage = {
            ...defaultValue,
            ...storedValue,
        };
    }

    async getVotingKeyFile(
        networkType: NetworkType,
        nodeInformation: NodeInformation,
        startEpoch: number,
        endEpoch: number,
    ): Promise<VotingKeyFileContent> {
        const votingUtils = new VotingUtils();
        const nodeKey = `node-${nodeInformation.number}-${startEpoch}-${endEpoch}`;
        const storedFile = this.storage.votingFiles[nodeKey];
        if (storedFile) {
            const fileContent = Buffer.from(storedFile, 'base64');
            const votingFile = votingUtils.readVotingFile(fileContent);
            if (votingFile.startEpoch != startEpoch) {
                throw new Error(`Unexpected startEpoch on stored file. Expected ${startEpoch} but got ${votingFile.startEpoch}`);
            }
            if (votingFile.endEpoch != endEpoch) {
                throw new Error(`Unexpected endEpoch on stored file. Expected ${endEpoch} but got ${votingFile.endEpoch}`);
            }
            return { ...votingFile, fileContent };
        }

        const votingAccount = Account.generateNewAccount(networkType);
        const votingFile = {
            publicKey: votingAccount.publicKey,
            startEpoch: startEpoch,
            endEpoch: endEpoch,
        };
        const fileContent = await votingUtils.createVotingFile(votingAccount.privateKey, votingFile.startEpoch, votingFile.endEpoch);
        this.storage.votingFiles = this.storage.votingFiles || {};
        this.storage.votingFiles[nodeKey] = Buffer.from(fileContent).toString('base64');
        await this.save();
        return { ...votingFile, fileContent };
    }

    async saveNetworkAccount(networkType: NetworkType, accountName: NetworkAccountName, privateKey: string): Promise<void> {
        this.storage.network = this.storage.network || {};
        this.storage.network[accountName] = this.toStored(Account.createFromPrivateKey(privateKey, networkType));
        await this.save();
    }

    async getNetworkAccount(networkType: NetworkType, accountName: NetworkAccountName): Promise<Account> {
        const storedAccount = this.storage.network[accountName] || this.toStored(Account.generateNewAccount(networkType));
        const account = Account.createFromPrivateKey(storedAccount.privateKey, networkType);
        this.storage.network = this.storage.network || {};
        this.storage.network[accountName] = this.toStored(account);
        await this.save();
        return account;
    }

    async getNetworkAccountIfExists(networkType: NetworkType, accountName: NetworkAccountName): Promise<Account | undefined> {
        const storedAccount = this.storage.network[accountName];
        if (!storedAccount) {
            return undefined;
        }
        const account = Account.createFromPrivateKey(storedAccount.privateKey, networkType);
        this.storage.network = this.storage.network || {};
        this.storage.network[accountName] = this.toStored(account);
        await this.save();
        return account;
    }

    private save(): Promise<void> {
        return BootstrapUtils.writeYaml(this.storageFile, this.storage, this.password);
    }

    async getNodeAccount(networkType: NetworkType, keyName: KeyName, nodeInformation: NodeInformation): Promise<Account> {
        const nodeKey = `node-${nodeInformation.number}`;
        const storedAccount = this.storage.nodes[nodeKey]?.[keyName] || this.toStored(Account.generateNewAccount(networkType));
        const account = Account.createFromPrivateKey(storedAccount.privateKey, networkType);
        this.storage.nodes = this.storage.nodes || {};
        this.storage.nodes[nodeKey] = this.storage.nodes[nodeKey] || {};
        this.storage.nodes[nodeKey][keyName] = this.toStored(account);
        await this.save();
        return account;
    }
    public toStored(account: Account): StoredAccount {
        return {
            privateKey: account.privateKey,
            publicKey: account.publicKey,
            address: account.address.plain(),
        };
    }
}
