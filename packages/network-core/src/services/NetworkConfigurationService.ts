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

import { writeFileSync } from 'fs';
import _ from 'lodash';
import { join } from 'path';
import {
    BootstrapService,
    BootstrapUtils,
    ComposeService,
    ConfigLoader,
    ConfigResult,
    ConfigService,
    CryptoUtils,
    CustomPreset,
    KeyName,
    Logger,
    NodePreset,
    NodeType,
    PeerInfo,
    PrivateKeySecurityMode,
    VotingKeyFile,
    VotingKeyParams,
} from 'symbol-bootstrap-core';
import { NetworkType } from 'symbol-sdk';
import { AccountStorage, NetworkUtils } from '.';
import { AwsNodeData, Region, regions } from '../deployment/aws';
import { DeploymentType, NetworkFile, NodeInformation, NodeMetadataUtils, nodesMetadata } from '../model';

export class NetworkConfigurationService {
    constructor(private readonly logger: Logger, private readonly accountStorage: AccountStorage) {}

    public async expandNodes(inputFile: string, outputFile: string): Promise<NetworkFile> {
        const input = await NetworkUtils.loadNetworkInput(inputFile);
        const { nodeTypes, ...rest } = input;
        const nodes: NodeInformation[] = [];
        let nodeCounter = 0;
        const counters: Record<string, number> = {};
        for (const nodeTypeInput of nodeTypes) {
            const region: Region | undefined =
                input.deploymentData.type == DeploymentType.AWS ? (nodeTypeInput as any as AwsNodeData).region : undefined;
            const { total, ...everythingElse } = nodeTypeInput;
            for (let index = 0; index < total; index++) {
                const nickname = nodeTypeInput.nickName;
                const regionIndex = region ? regions.indexOf(region) : 0;
                const counterIndex = nickname + regionIndex;
                counters[counterIndex] = (counters[counterIndex] || 0) + 1;
                const nickNameNumber = counters[counterIndex];
                const friendlyNumber = regionIndex + NetworkUtils.zeroPad(nickNameNumber, 2);
                const friendlyName = `${input.suffix}-${nickname}-${friendlyNumber}`;
                const hostname = `${input.suffix}-${nickname}-${friendlyNumber}.${input.domain}`;
                const metadata = nodesMetadata[nodeTypeInput.nodeType];
                const assembly = NodeMetadataUtils.getAssembly(metadata);

                const customPreset: CustomPreset = {
                    privateKeySecurityMode: PrivateKeySecurityMode.PROMPT_MAIN_TRANSPORT,
                    nodes: [
                        {
                            friendlyName: friendlyName,
                            host: hostname,
                            voting: metadata.voting,
                            harvesting: metadata.harvesting,
                            dockerComposeDebugMode: false,
                            brokerDockerComposeDebugMode: false,
                        },
                    ],
                };
                if (metadata.demo) {
                    const faucetAccount = input.faucetBalances
                        ? await this.accountStorage.getNetworkAccount(input.networkType, 'faucet')
                        : undefined;
                    customPreset.faucets = [
                        {
                            repeat: faucetAccount ? 1 : 0,
                            environment: {
                                FAUCET_PRIVATE_KEY: faucetAccount?.privateKey || '',
                            },
                        },
                    ];
                }
                const node = {
                    number: ++nodeCounter,
                    friendlyName: friendlyName,
                    assembly: assembly,
                    hostname: hostname,
                    customPreset: customPreset,
                    ...everythingElse,
                };
                nodes.push(node);
            }
        }

        if (nodes.length != _.uniqBy(nodes, (node) => node.friendlyName).length) {
            throw new Error('Duplicated friendlyNames!!');
        }
        if (nodes.length != _.uniqBy(nodes, (node) => node.hostname).length) {
            throw new Error('Duplicated hostname!!');
        }
        const output: NetworkFile = {
            ...rest,
            nodes: nodes,
        };
        await BootstrapUtils.writeYaml(outputFile, output, undefined);
        return output;
    }

    public async updateNodes(inputFile: string, outputFile: string): Promise<void> {
        const input = (await BootstrapUtils.loadYaml(inputFile, undefined)) as NetworkFile;
        const networkPreset = await ConfigLoader.loadNetworkPreset(BootstrapUtils.DEFAULT_ROOT_FOLDER, input.preset);
        const customNetwork = BootstrapUtils.isYmlFile(input.preset);
        if (customNetwork && !input.nemesisSeedFolder) {
            throw new Error('nemesisSeedFolder must be provided when creating nodes for a custom network!');
        }
        const networkType = input.networkType;
        const service = new BootstrapService();
        for (const node of input.nodes) {
            const hostname = node.hostname;
            this.logger.info('');
            this.logger.info(`Upgrading node ${node.number} ${hostname}`);
            this.logger.info('');
            const nodeFolder = join('nodes', `node-${NetworkUtils.zeroPad(node.number, 3)}`);

            await BootstrapUtils.mkdir(nodeFolder);

            const runtimeCustomPreset = CryptoUtils.removePrivateKeys(node.customPreset) as CustomPreset;

            const toStoreCustomPreset = CryptoUtils.removePrivateKeys(node.customPreset) as CustomPreset;

            const nodeCustomPreset: Partial<NodePreset> | undefined = runtimeCustomPreset?.nodes?.[0];
            if (!nodeCustomPreset) {
                throw new Error(`Node's custom preset cannot be found!`);
            }

            const mainAccount = await this.accountStorage.getNodeAccount(networkType, KeyName.Main, node);
            const vrfAccount = await this.accountStorage.getNodeAccount(networkType, KeyName.VRF, node);
            const remoteAccount = await this.accountStorage.getNodeAccount(networkType, KeyName.Remote, node);
            const transportAccount = await this.accountStorage.getNodeAccount(networkType, KeyName.Transport, node);

            nodeCustomPreset.mainPrivateKey = mainAccount.privateKey;
            nodeCustomPreset.vrfPrivateKey = vrfAccount.privateKey;
            nodeCustomPreset.remotePrivateKey = remoteAccount.privateKey;
            nodeCustomPreset.transportPrivateKey = transportAccount.privateKey;

            if (nodeCustomPreset.rewardProgram) {
                const agentAccount = await this.accountStorage.getNodeAccount(networkType, KeyName.Agent, node);
                nodeCustomPreset.agentPrivateKey = agentAccount.privateKey;
            }
            const customPresetFile = join(nodeFolder, 'custom-preset.yml');
            const localNemesisSeedFolder = 'nemesis-seed';
            const nemesisSeedFolder = join(nodeFolder, localNemesisSeedFolder);
            if (input.nemesisSeedFolder) {
                toStoreCustomPreset.nemesisSeedFolder = localNemesisSeedFolder;
                await BootstrapUtils.generateConfiguration({}, input.nemesisSeedFolder, nemesisSeedFolder);
                runtimeCustomPreset.nemesisSeedFolder = nemesisSeedFolder;
            }

            await BootstrapUtils.writeYaml(customPresetFile, toStoreCustomPreset, undefined);
            const targetPassword = undefined;
            const bootstrapTargetFolder = join(nodeFolder, 'target');
            if (BootstrapUtils.isYmlFile(input.preset)) {
                await BootstrapUtils.writeYaml(join(nodeFolder, 'custom-network-preset.yml'), networkPreset, undefined);
            }
            const accountStorage = this.accountStorage;
            const result: ConfigResult = await service.config({
                ...ConfigService.defaultParams,
                target: bootstrapTargetFolder,
                preset: input.preset,
                upgrade: true,
                assembly: node.assembly,
                password: targetPassword,
                customPresetObject: runtimeCustomPreset,
                votingKeyFileProvider: {
                    async createVotingFile(params: VotingKeyParams): Promise<VotingKeyFile> {
                        const votingFile = await accountStorage.getVotingKeyFile(
                            networkType,
                            node,
                            params.votingKeyStartEpoch,
                            params.votingKeyEndEpoch,
                        );
                        writeFileSync(join(params.votingKeysFolder, params.privateKeyTreeFileName), votingFile.fileContent);
                        return { ...votingFile, filename: params.privateKeyTreeFileName };
                    },
                },
            });

            await service.compose(
                {
                    ...ComposeService.defaultParams,
                    target: bootstrapTargetFolder,
                    upgrade: true,
                    password: targetPassword,
                },
                result.presetData,
                result.addresses,
            );
            const nodeAddresses = result.addresses.nodes?.[0];
            if (!nodeAddresses) {
                throw new Error('Node addresses should have been resolved!!!');
            }
            node.addresses = nodeAddresses;
            // const friendlyName = node.friendlyName;
            // const zipName = `${hostname}.zip`;
            // const nodeRegionDir = `${flags.output}/regions/${node.region}`;
            // await BootstrapUtils.mkdir(nodeRegionDir);
            // await BootstrapUtils.mkdir(nodeRegionDir);
            // const localZipFilePath = join(nodeRegionDir, zipName);
            // await ZipUtils.zip(localZipFilePath, [
            //     {
            //         from: nodeFolder,
            //         to: '',
            //         directory: true,
            //     },
            // ]);
            // await BootstrapUtils.mkdir(
            //     join(flags.output, 'nodes', node.region),
            // );
            // copyFileSync(
            //     localZipFilePath,
            //     join(flags.output, 'nodes', node.region, zipName),
            // );
        }

        // if (input.nemesisData) {
        //     input.nemesisData.transactions = transactions;
        // }

        await BootstrapUtils.writeYaml(outputFile, CryptoUtils.removePrivateKeys(input), undefined);
        this.logger.info('');
        this.logger.info(`The ${outputFile} file has been updated!`);
        this.logger.info('');
        this.logger.info(`Nodes have been created/upgraded. You can now zip and deploy them...`);
    }

    public static async updateNetworkPreset(
        networkInput: {
            networkDescription: string;
            networkType: NetworkType;
            epochAdjustment: number;
            nemesisGenerationHashSeed: string;
            rewardProgramControllerApiUrl?: string;
            knownRestGateways?: string[];
            knownPeers?: Record<NodeType, PeerInfo[]>;
        },
        accountStorage: AccountStorage,
        networkPreset: CustomPreset,
    ): Promise<CustomPreset> {
        const networkType = networkInput.networkType;
        const nemesisSignerAccount = await accountStorage.getNetworkAccount(networkType, 'nemesisSigner');
        const harvestNetworkFeeSinkAccount = await accountStorage.getNetworkAccount(networkType, 'harvestNetworkFeeSink');
        const namespaceRentalFeeSinkAccount = await accountStorage.getNetworkAccount(networkType, 'namespaceRentalFeeSink');
        const mosaicRentalFeeSinkAccount = await accountStorage.getNetworkAccount(networkType, 'mosaicRentalFeeSink');
        const founderAccount = await accountStorage.getNetworkAccount(networkType, 'founder');
        delete networkPreset.currencyMosaicId;
        delete networkPreset.harvestingMosaicId;
        if (networkInput.rewardProgramControllerApiUrl) {
            networkPreset.rewardProgramControllerApiUrl = networkInput.rewardProgramControllerApiUrl;
            const rewardProgramEnrollmentAccount = await accountStorage.getNetworkAccount(networkType, 'rewardProgramEnrollment');
            networkPreset.rewardProgramEnrollmentAddress = rewardProgramEnrollmentAccount.address.plain();
        } else {
            delete networkPreset.rewardProgramControllerApiUrl;
            delete networkPreset.rewardProgramEnrollmentAddress;
        }

        delete networkPreset.currencyMosaicId;
        delete networkPreset.harvestingMosaicId;
        networkPreset.networkDescription = networkInput.networkDescription;
        networkPreset.epochAdjustment = networkInput.epochAdjustment + 's';
        networkPreset.lastKnownNetworkEpoch = 1;
        networkPreset.nemesisGenerationHashSeed = networkInput.nemesisGenerationHashSeed;
        networkPreset.networkType = networkType;
        networkPreset.nemesisSignerPublicKey = nemesisSignerAccount.publicKey;

        networkPreset.harvestNetworkFeeSinkAddress = harvestNetworkFeeSinkAccount.address.plain();
        networkPreset.namespaceRentalFeeSinkAddress = namespaceRentalFeeSinkAccount.address.plain();
        networkPreset.mosaicRentalFeeSinkAddress = mosaicRentalFeeSinkAccount.address.plain();

        networkPreset.knownRestGateways = networkInput.knownRestGateways;
        networkPreset.knownPeers = networkInput.knownPeers;
        if (!networkPreset.nemesis) {
            throw new Error('Nemesis should exist when creating a new network!');
        }
        if (!networkPreset.nemesis.mosaics) {
            throw new Error(`Nemesis's mosaics should exist when creating a new network!`);
        }
        networkPreset.nemesis.mosaics.forEach((m) => {
            if (!m) {
                throw new Error('Mosaic should exist when creating a new network!');
            }
            m.accounts = [founderAccount.publicKey];
        });
        return networkPreset;
    }
}
