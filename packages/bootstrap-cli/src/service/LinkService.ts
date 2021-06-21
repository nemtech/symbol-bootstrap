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

import { prompt } from 'inquirer';
import {
    Addresses,
    BootstrapUtils,
    ConfigLoader,
    ConfigPreset,
    KeyAccount,
    LinkTransactionGenericFactory,
    Logger,
    LoggerFactory,
    LogType,
    NodeAccount,
    VotingKeyAccount,
} from 'symbol-bootstrap-core';
import {
    AccountInfo,
    AccountKeyLinkTransaction,
    Deadline,
    LinkAction,
    Transaction,
    UInt64,
    VotingKeyLinkTransaction,
    VrfKeyLinkTransaction,
} from 'symbol-sdk';
import { AnnounceService, TransactionFactory } from './AnnounceService';

/**
 * params necessary to announce link transactions network.
 */
export type LinkParams = {
    target: string;
    password?: string;
    url: string;
    maxFee?: number | undefined;
    unlink: boolean;
    useKnownRestGateways: boolean;
    ready?: boolean;
    customPreset?: string;
    removeOldLinked?: boolean; //TEST ONLY!
};

const logger: Logger = LoggerFactory.getLogger(LogType.System);

export interface LinkServiceTransactionFactoryParams {
    presetData: ConfigPreset;
    nodeAccount: NodeAccount;
    mainAccountInfo: AccountInfo;
    deadline: Deadline;
    maxFee: UInt64;
    latestFinalizedBlockEpoch?: number;
}

export class LinkService implements TransactionFactory {
    public static readonly defaultParams: LinkParams = {
        target: BootstrapUtils.defaultTargetFolder,
        useKnownRestGateways: false,
        ready: false,
        url: 'http://localhost:3000',
        maxFee: 100000,
        unlink: false,
    };

    private readonly configLoader: ConfigLoader;

    constructor(protected readonly params: LinkParams) {
        this.configLoader = new ConfigLoader();
    }

    public async run(passedPresetData?: ConfigPreset | undefined, passedAddresses?: Addresses | undefined): Promise<void> {
        const presetData = passedPresetData ?? this.configLoader.loadExistingPresetData(this.params.target, this.params.password);
        const addresses = passedAddresses ?? this.configLoader.loadExistingAddresses(this.params.target, this.params.password);
        const customPreset = this.configLoader.loadCustomPreset(this.params.customPreset, this.params.password);
        logger.info(`${this.params.unlink ? 'Unlinking' : 'Linking'} nodes`);

        await new AnnounceService().announce(
            this.params.url,
            this.params.maxFee,
            this.params.useKnownRestGateways,
            this.params.ready,
            this.params.target,
            this.configLoader.mergePresets(presetData, customPreset),
            addresses,
            this,
        );
    }
    public async createTransactions({
        presetData,
        nodeAccount,
        mainAccountInfo,
        deadline,
        maxFee,
        latestFinalizedBlockEpoch,
    }: LinkServiceTransactionFactoryParams): Promise<Transaction[]> {
        const networkType = presetData.networkType;
        const nodeName = nodeAccount.name;

        const remoteTransactionFactory = ({ publicKey }: KeyAccount, action: LinkAction): AccountKeyLinkTransaction =>
            AccountKeyLinkTransaction.create(deadline, publicKey, action, networkType, maxFee);
        const vrfTransactionFactory = ({ publicKey }: KeyAccount, action: LinkAction): VrfKeyLinkTransaction =>
            VrfKeyLinkTransaction.create(deadline, publicKey, action, networkType, maxFee);
        const votingKeyTransactionFactory = (account: VotingKeyAccount, action: LinkAction): VotingKeyLinkTransaction => {
            return VotingKeyLinkTransaction.create(
                deadline,
                account.publicKey,
                account.startEpoch,
                account.endEpoch,
                action,
                networkType,
                1,
                maxFee,
            );
        };

        logger.info(`Creating transactions for node: ${nodeName}, ca/main account: ${mainAccountInfo.address.plain()}`);
        const transactions = await new LinkTransactionGenericFactory(logger, this.confirmUnlink, this.params).createGenericTransactions(
            nodeName,
            {
                vrf: mainAccountInfo.supplementalPublicKeys.vrf,
                remote: mainAccountInfo.supplementalPublicKeys.linked,
                voting: mainAccountInfo.supplementalPublicKeys.voting,
            },
            nodeAccount,
            latestFinalizedBlockEpoch || presetData.lastKnownNetworkEpoch,
            remoteTransactionFactory,
            vrfTransactionFactory,
            votingKeyTransactionFactory,
        );
        //Unlink transactions go first.
        return transactions.sort((t1, t2) => t1.linkAction - t2.linkAction);
    }

    private confirmUnlink = async <T>(accountName: string, alreadyLinkedAccount: T, print: (account: T) => string): Promise<boolean> => {
        if (this.params.removeOldLinked === undefined) {
            return (
                this.params.ready ||
                (
                    await prompt([
                        {
                            name: 'value',
                            message: `Do you want to unlink the old ${accountName} ${print(alreadyLinkedAccount)}?`,
                            type: 'confirm',
                            default: false,
                        },
                    ])
                ).value
            );
        }
        return this.params.removeOldLinked;
    };
}
