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
import * as _ from 'lodash';
import { join } from 'path';
import {
    Assembly,
    BootstrapService,
    BootstrapUtils,
    ConfigLoader,
    ConfigService,
    CryptoUtils,
    CustomPreset,
    KeyName,
    Logger,
    NemesisPreset,
    PeerInfo,
} from 'symbol-bootstrap-core';
import { AccountKeyLinkTransaction, Deadline, LinkAction, VotingKeyLinkTransaction, VrfKeyLinkTransaction } from 'symbol-sdk';
import { nodesMetadata, TransactionInformation } from '../model';
import { AccountStorage, NetworkConfigurationService, NetworkUtils } from '../services';

export interface KnownPeersInformation {
    'api-node': PeerInfo[];
    'peer-node': PeerInfo[];
}

export class NetworkGenesisService {
    constructor(private readonly logger: Logger, private readonly accountStorage: AccountStorage) {}

    public async generateNemesis(inputFile: string, outputFile: string, regenerate: boolean): Promise<string> {
        const input = await NetworkUtils.loadNetwork(inputFile);
        if (!BootstrapUtils.isYmlFile(input.preset) || !input.isNewNetwork) {
            throw new Error(`You are creating nodes for an existing network. Nemesis cannot be generated!`);
        }
        if (input.nemesisSeedFolder && existsSync(input.nemesisSeedFolder) && !regenerate) {
            throw new Error(`The nemesis block has been previously generated.`);
        }
        this.logger.info('');
        const root = BootstrapUtils.DEFAULT_ROOT_FOLDER;
        const transactions: TransactionInformation[] = [];

        const deadline = Deadline.createFromDTO('1');
        const knownPeers: KnownPeersInformation = {
            'api-node': [],
            'peer-node': [],
        };
        const nemesisBalances: {
            mosaicIndex: number;
            address: string;
            amount: number;
        }[] = [];

        const service = new BootstrapService(root);
        const knownRestGateways = [];
        const nemesisTargetFolder = 'nemesis-target';
        const nodesFolder = 'nodes';
        await BootstrapUtils.deleteFolder(nemesisTargetFolder);
        await BootstrapUtils.deleteFolder(nodesFolder);
        this.logger.info('');
        const networkPreset: CustomPreset = await NetworkConfigurationService.updateNetworkPreset(
            input,
            this.accountStorage,
            ConfigLoader.loadNetworkPreset(root, input.preset),
        );
        await BootstrapUtils.writeYaml(input.preset, networkPreset, undefined);
        const nemesisGenerationHashSeed = input.nemesisGenerationHashSeed;
        const networkType = input.networkType;
        const nemesisPreset = networkPreset.nemesis as NemesisPreset;
        if (!nemesisPreset) {
            throw new Error('Nemesis must be resolved from network preset!');
        }
        if (!nemesisPreset.mosaics) throw new Error(`Network nemesis's mosaics must be found!`);

        const founderAccount = await this.accountStorage.getNetworkAccount(networkType, 'founder');
        for (const node of input.nodes) {
            const metadata = nodesMetadata[node.nodeType];
            const hostname = node.hostname;
            const nodeId = `node-${NetworkUtils.zeroPad(node.number, 3)}`;
            this.logger.info(`Generating transactions and balances for node ${nodeId} ${hostname}`);
            const mainAccount = await this.accountStorage.getNodeAccount(networkType, KeyName.Main, node);
            const vrfAccount = await this.accountStorage.getNodeAccount(networkType, KeyName.VRF, node);
            const remoteAccount = await this.accountStorage.getNodeAccount(networkType, KeyName.Remote, node);
            const roles: string[] = [];
            //Api,Peer,Voting
            if (metadata.api) {
                roles.push('Api');
            }
            if (metadata.peer) {
                roles.push('Peer');
            }
            if (metadata.voting) {
                roles.push('Voting');
            }
            const peerInfo: PeerInfo = {
                publicKey: mainAccount.publicKey,
                endpoint: {
                    host: node.hostname,
                    port: 7900,
                },
                metadata: {
                    name: node.friendlyName,
                    roles: roles.join(','),
                },
            };

            if (metadata.api) {
                knownRestGateways.push(`http://${hostname}:3000`);
                knownPeers['api-node'].push(peerInfo);
            } else {
                knownPeers['peer-node'].push(peerInfo);
            }

            nemesisPreset.mosaics.forEach((m, mosaicIndex) => {
                const nodeBalance = node.balances[mosaicIndex] || 0;
                if (nodeBalance) {
                    const divisibility = nemesisPreset.mosaics[mosaicIndex].divisibility;
                    if (divisibility == undefined) {
                        throw new Error('Divisibility should be defined!!');
                    }
                    nemesisBalances.push({
                        mosaicIndex: mosaicIndex,
                        address: mainAccount.address.plain(),
                        amount: parseInt(nodeBalance + NetworkUtils.zeroPad(0, divisibility)),
                    });
                }
            });

            if (vrfAccount) {
                const transaction = VrfKeyLinkTransaction.create(deadline, vrfAccount.publicKey, LinkAction.Link, networkType);
                transactions.push({
                    nodeNumber: node.number,
                    type: 'VRF',
                    typeNumber: 1,
                    payload: mainAccount.sign(transaction, nemesisGenerationHashSeed).payload,
                });
            }

            if (remoteAccount) {
                const transaction = AccountKeyLinkTransaction.create(deadline, remoteAccount.publicKey, LinkAction.Link, networkType);
                transactions.push({
                    nodeNumber: node.number,
                    type: 'Remote',
                    typeNumber: 2,
                    payload: mainAccount.sign(transaction, nemesisGenerationHashSeed).payload,
                });
            }

            if (metadata.voting) {
                const votingKeyDesiredLifetime = node.customPreset?.votingKeyDesiredLifetime || networkPreset.votingKeyDesiredLifetime;
                if (!votingKeyDesiredLifetime) {
                    throw new Error('votingKeyDesiredLifetime must be resolved!');
                }

                const votingFileData = await this.accountStorage.getVotingKeyFile(networkType, node, 1, votingKeyDesiredLifetime);

                const transaction = VotingKeyLinkTransaction.create(
                    deadline,
                    votingFileData.publicKey,
                    votingFileData.startEpoch,
                    votingFileData.endEpoch,
                    LinkAction.Link,
                    networkType,
                    1,
                );
                transactions.push({
                    nodeNumber: node.number,
                    type: 'Voting',
                    typeNumber: 3,
                    payload: mainAccount.sign(transaction, nemesisGenerationHashSeed).payload,
                });
            }
        }
        const nemesisSigner = await this.accountStorage.getNetworkAccount(networkType, 'nemesisSigner');
        networkPreset.knownPeers = knownPeers;
        networkPreset.knownRestGateways = knownRestGateways;
        await BootstrapUtils.writeYaml(input.preset, networkPreset, undefined);
        this.logger.info('');
        this.logger.info(`The ${input.preset} file has been updated!`);
        this.logger.info('');
        const nemesisTransactions: Record<string, string> = _.mapValues(
            _.keyBy(transactions, (transaction) => NetworkUtils.getTransactionKey(transaction)),
            (transaction) => transaction.payload,
        );

        const faucetBalances = input.faucetBalances;
        const faucetAccount = faucetBalances ? await this.accountStorage.getNetworkAccount(networkType, 'faucet') : undefined;
        if (faucetBalances && faucetAccount) {
            nemesisPreset.mosaics.forEach((m, mosaicIndex) => {
                const faucetBalance = input.faucetBalances?.[mosaicIndex];
                if (faucetBalance) {
                    const divisibility = nemesisPreset.mosaics[mosaicIndex].divisibility;
                    if (divisibility == undefined) {
                        throw new Error('Divisibility should be defined!!');
                    }
                    nemesisBalances.push({
                        mosaicIndex: mosaicIndex,
                        address: faucetAccount.address.plain(),
                        amount: parseInt(faucetBalance + NetworkUtils.zeroPad(0, divisibility)),
                    });
                }
            });
        }

        const nemesisCustomPreset: CustomPreset = {
            nodes: [
                {
                    balances: [0, 0],
                },
            ],
            nemesis: {
                nemesisSignerPrivateKey: nemesisSigner.privateKey,
                mosaics: nemesisPreset.mosaics.map((m, index) => ({
                    accounts: [founderAccount.publicKey],
                    currencyDistributions: nemesisBalances.filter((n) => n.mosaicIndex === index).map(({ mosaicIndex, ...rest }) => rest),
                })),
                transactions: nemesisTransactions,
            },
            faucets: [
                {
                    repeat: faucetAccount ? 1 : 0,
                    environment: {
                        FAUCET_PRIVATE_KEY: faucetAccount?.privateKey || '',
                    },
                },
            ],
        };
        this.logger.info(`Generating nemesis block...`);
        this.logger.info('');
        await service.config({
            ...ConfigService.defaultParams,
            target: nemesisTargetFolder,
            preset: input.preset,
            reset: true,
            report: true,
            assembly: Assembly.demo,
            customPresetObject: nemesisCustomPreset,
        });
        input.nemesisSeedFolder = join(nemesisTargetFolder, 'nemesis', 'seed');
        await BootstrapUtils.writeYaml(outputFile, CryptoUtils.removePrivateKeys(input), undefined);
        return nemesisTargetFolder;
    }
}
