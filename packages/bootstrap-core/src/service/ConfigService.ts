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

import * as fs from 'fs';
import { copyFileSync, existsSync, promises as fsPromises } from 'fs';
import * as _ from 'lodash';
import { join } from 'path';
import {
    Account,
    AccountKeyLinkTransaction,
    Convert,
    Deadline,
    LinkAction,
    NamespaceId,
    NetworkType,
    Transaction,
    TransactionMapping,
    UInt64,
    VotingKeyLinkTransaction,
    VrfKeyLinkTransaction,
} from 'symbol-sdk';
import { LogType } from '../logger';
import { Logger } from '../logger/Logger';
import { LoggerFactory } from '../logger/LoggerFactory';
import { Addresses, CertificatePair, ConfigPreset, CustomPreset, GatewayConfigPreset, NodeAccount, NodePreset, NodeType } from '../model';
import { AgentCertificateService } from './AgentCertificateService';
import { BootstrapUtils, KnownError, Password } from './BootstrapUtils';
import { CertificateService } from './CertificateService';
import { ConfigLoader } from './ConfigLoader';
import { CryptoUtils } from './CryptoUtils';
import { NemgenService } from './NemgenService';
import { RemoteNodeService } from './RemoteNodeService';
import { ReportParams, ReportService } from './ReportService';
import { RewardProgramUtils } from './RewardProgramUtils';
import { VotingParams, VotingService } from './VotingService';

export interface PrivateKeyResolver {
    resolvePrivateKey(
        networkType: NetworkType,
        account: CertificatePair | undefined,
        keyName: KeyName,
        nodeName: string,
        operationDescription: string,
    ): Promise<string>;
}

export class DefaultPrivateKeyResolver implements PrivateKeyResolver {
    public async resolvePrivateKey(networkType: NetworkType, account: CertificatePair | undefined): Promise<string> {
        if (!account) {
            return '';
        }
        if (!account.privateKey) {
            throw new Error('Private Key could not be resolved!');
        }
        return account.privateKey.toUpperCase();
    }
}

/**
 * Defined presets.
 */
export enum Preset {
    dualCurrency = 'dualCurrency',
    singleCurrency = 'singleCurrency',
    testnet = 'testnet',
    mainnet = 'mainnet',
}

export enum Assembly {
    api = 'api',
    demo = 'demo',
    dual = 'dual',
    multinode = 'multinode',
    peer = 'peer',
}

export enum KeyName {
    Main = 'Main',
    Remote = 'Remote',
    Transport = 'Transport',
    Voting = 'Voting',
    VRF = 'VRF',
    Agent = 'Agent',
    NemesisSigner = 'Nemesis Signer',
    NemesisAccount = 'Nemesis Account',
}

export interface ConfigParams extends VotingParams, ReportParams {
    report: boolean;
    reset: boolean;
    upgrade: boolean;
    offline?: boolean;
    preset?: string;
    target: string;
    password?: string;
    user: string;
    assembly?: string;
    customPreset?: string;
    customPresetObject?: CustomPreset;
    privateKeyResolver: PrivateKeyResolver;
}

export interface ConfigResult {
    addresses: Addresses;
    presetData: ConfigPreset;
}

const logger: Logger = LoggerFactory.getLogger(LogType.System);

export class ConfigService {
    public static defaultParams: ConfigParams = {
        target: BootstrapUtils.defaultTargetFolder,
        report: false,
        offline: false,
        reset: false,
        upgrade: false,
        user: BootstrapUtils.CURRENT_USER,
        privateKeyResolver: new DefaultPrivateKeyResolver(),
    };
    private readonly configLoader: ConfigLoader;

    constructor(private readonly root: string, private readonly params: ConfigParams) {
        this.configLoader = new ConfigLoader();
    }

    public async run(): Promise<ConfigResult> {
        const target = this.params.target;
        try {
            if (this.params.reset) {
                BootstrapUtils.deleteFolder(target);
            }
            const presetLocation = this.configLoader.getGeneratedPresetLocation(target);
            const addressesLocation = this.configLoader.getGeneratedAddressLocation(target);
            const password = this.params.password;
            if (fs.existsSync(presetLocation) && !this.params.upgrade) {
                logger.info(
                    `The generated preset ${presetLocation} already exist, ignoring configuration. (run -r to reset or --upgrade to upgrade)`,
                );
                const presetData = this.configLoader.loadExistingPresetData(target, password);
                const addresses = this.configLoader.loadExistingAddresses(target, password);
                if (this.params.report) {
                    await new ReportService(this.root, this.params).run(presetData);
                }
                return { presetData, addresses };
            }

            const oldPresetData = this.configLoader.loadExistingPresetDataIfPreset(target, password);
            const oldAddresses = this.configLoader.loadExistingAddressesIfPreset(target, password);

            if (oldAddresses && !oldPresetData) {
                throw new KnownError(`Configuration cannot be upgraded without a previous ${presetLocation} file. (run -r to reset)`);
            }

            if (!oldAddresses && oldPresetData) {
                throw new KnownError(`Configuration cannot be upgraded without a previous ${addressesLocation} file. (run -r to reset)`);
            }

            if (oldAddresses && oldPresetData) {
                logger.info('Upgrading configuration...');
            }

            const presetData: ConfigPreset = this.resolveCurrentPresetData(oldPresetData, password);
            const addresses = await this.configLoader.generateRandomConfiguration(
                this.root,
                oldAddresses,
                oldPresetData,
                presetData,
                this.params.privateKeyResolver,
            );

            const privateKeySecurityMode = CryptoUtils.getPrivateKeySecurityMode(presetData.privateKeySecurityMode);
            await BootstrapUtils.mkdir(target);

            this.cleanUpConfiguration(presetData);
            await this.generateNodeCertificates(presetData, addresses);
            await this.generateAgentCertificates(presetData, addresses);
            await this.generateNodes(presetData, addresses);
            await this.generateGateways(presetData);
            await this.generateExplorers(presetData);
            await this.generateWallets(presetData);
            const isUpgrade = !!oldPresetData || !!oldAddresses;
            await this.resolveNemesis(presetData, addresses, isUpgrade);
            if (this.params.report) {
                await new ReportService(this.root, this.params).run(presetData);
            }
            await BootstrapUtils.writeYaml(
                addressesLocation,
                CryptoUtils.removePrivateKeysAccordingToSecurityMode(addresses, privateKeySecurityMode),
                password,
            );
            await BootstrapUtils.writeYaml(presetLocation, CryptoUtils.removePrivateKeys(presetData), password);
            logger.info(`Configuration generated.`);
            return { presetData, addresses };
        } catch (e) {
            if (e.known) {
                logger.error(e.message);
            } else {
                logger.error(`Unknown error generating the configuration. ${e.message}`);
                logger.error(`The target folder '${target}' should be deleted!!!`);
                console.log(e);
            }
            throw e;
        }
    }

    private resolveCurrentPresetData(oldPresetData: ConfigPreset | undefined, password: Password) {
        return this.configLoader.createPresetData({ ...this.params, root: this.root, password: password, oldPresetData });
    }

    private async resolveNemesis(presetData: ConfigPreset, addresses: Addresses, isUpgrade: boolean): Promise<void> {
        const target = this.params.target;
        const nemesisSeedFolder = BootstrapUtils.getTargetNemesisFolder(target, false, 'seed');
        await BootstrapUtils.mkdir(nemesisSeedFolder);
        if (ConfigLoader.shouldCreateNemesis(this.root, presetData)) {
            if (isUpgrade) {
                logger.info('Nemesis data cannot be generated when upgrading...');
            } else {
                await BootstrapUtils.deleteFolder(nemesisSeedFolder);
                await BootstrapUtils.mkdir(nemesisSeedFolder);
                await this.generateNemesisConfig(presetData, addresses);
                await BootstrapUtils.validateSeedFolder(nemesisSeedFolder, `Is the generated nemesis seed a valid seed folder?`);
            }
            return;
        }
        if (isUpgrade) {
            logger.info('Upgrading genesis on upgrade!');
        }
        if (presetData.nemesisSeedFolder) {
            await BootstrapUtils.validateSeedFolder(
                presetData.nemesisSeedFolder,
                `Is the provided preset nemesisSeedFolder: ${presetData.nemesisSeedFolder} a valid seed folder?`,
            );
            logger.info(`Using custom nemesis seed folder in ${presetData.nemesisSeedFolder}`);
            await BootstrapUtils.deleteFolder(nemesisSeedFolder);
            await BootstrapUtils.mkdir(nemesisSeedFolder);
            await BootstrapUtils.generateConfiguration({}, presetData.nemesisSeedFolder, nemesisSeedFolder);
            await BootstrapUtils.validateSeedFolder(
                nemesisSeedFolder,
                `Is the ${presetData.preset} preset default seed a valid seed folder?`,
            );
            return;
        }
        if (BootstrapUtils.isYmlFile(presetData.preset)) {
            throw new KnownError(`Seed for preset ${presetData.preset} could not be found. Please provide 'nemesisSeedFolder'!`);
        } else {
            const networkNemesisSeed = join(this.root, 'presets', presetData.preset, 'seed');
            if (existsSync(networkNemesisSeed)) {
                await BootstrapUtils.deleteFolder(nemesisSeedFolder);
                await BootstrapUtils.mkdir(nemesisSeedFolder);
                await BootstrapUtils.generateConfiguration({}, networkNemesisSeed, nemesisSeedFolder);
                await BootstrapUtils.validateSeedFolder(
                    nemesisSeedFolder,
                    `Is the ${presetData.preset} preset default seed a valid seed folder?`,
                );
                return;
            }
            logger.warn(`Seed for preset ${presetData.preset} could not be found in ${networkNemesisSeed}`);
            throw new Error('Seed could not be found!!!!');
        }
    }

    private async generateNodes(presetData: ConfigPreset, addresses: Addresses): Promise<void> {
        const currentFinalizationEpoch = this.params.offline
            ? presetData.lastKnownNetworkEpoch
            : await new RemoteNodeService().resolveCurrentFinalizationEpoch(
                  presetData,
                  this.params.offline == undefined ? ConfigLoader.shouldCreateNemesis(this.root, presetData) : this.params.offline,
              );
        await Promise.all(
            (addresses.nodes || []).map(
                async (account, index) =>
                    await this.generateNodeConfiguration(account, index, presetData, addresses, currentFinalizationEpoch),
            ),
        );
    }

    private async generateNodeCertificates(presetData: ConfigPreset, addresses: Addresses): Promise<void> {
        await Promise.all(
            (addresses.nodes || []).map(async (account) => {
                return await new CertificateService(this.root, this.params).run(
                    presetData.networkType,
                    presetData.symbolServerImage,
                    account.name,
                    {
                        main: account.main,
                        transport: account.transport,
                    },
                );
            }),
        );
    }

    private async generateAgentCertificates(presetData: ConfigPreset, addresses: Addresses): Promise<void> {
        await Promise.all(
            (addresses.nodes || []).map(async (account, index) => {
                const node = presetData.nodes?.[index];
                if (node?.rewardProgram && account.agent)
                    await new AgentCertificateService(this.root, this.params).run(
                        presetData.networkType,
                        presetData.symbolServerImage,
                        account.name,
                        {
                            agent: account.agent,
                        },
                    );
            }),
        );
    }

    private async generateNodeConfiguration(
        account: NodeAccount,
        index: number,
        presetData: ConfigPreset,
        addresses: Addresses,
        currentFinalizationEpoch: number | undefined,
    ) {
        const copyFrom = join(this.root, 'config', 'node');
        const name = account.name;

        const serverConfig = BootstrapUtils.getTargetNodesFolder(this.params.target, false, name, 'server-config');
        const brokerConfig = BootstrapUtils.getTargetNodesFolder(this.params.target, false, name, 'broker-config');
        const dataFolder = BootstrapUtils.getTargetNodesFolder(this.params.target, false, name, 'data');
        await BootstrapUtils.mkdir(dataFolder);

        const nodePreset = (presetData.nodes || [])[index];

        const harvesterSigningPrivateKey = nodePreset.harvesting
            ? await this.params.privateKeyResolver.resolvePrivateKey(
                  presetData.networkType,
                  account.remote || account.main,
                  account.remote ? KeyName.Remote : KeyName.Main,
                  account.name,
                  'storing the harvesterSigningPrivateKey in the server properties',
              )
            : '';
        const harvesterVrfPrivateKey = await this.params.privateKeyResolver.resolvePrivateKey(
            presetData.networkType,
            account.vrf,
            KeyName.VRF,
            account.name,
            'storing the harvesterVrfPrivateKey in the server properties',
        );

        const beneficiaryAddress = nodePreset.beneficiaryAddress || presetData.beneficiaryAddress;
        const generatedContext = {
            name: name,
            friendlyName: nodePreset?.friendlyName || account.friendlyName,
            harvesterSigningPrivateKey: harvesterSigningPrivateKey,
            harvesterVrfPrivateKey: harvesterVrfPrivateKey,
            unfinalizedBlocksDuration: nodePreset.voting
                ? presetData.votingUnfinalizedBlocksDuration
                : presetData.nonVotingUnfinalizedBlocksDuration,
            beneficiaryAddress: beneficiaryAddress == undefined ? account.main.address : beneficiaryAddress,
            roles: ConfigLoader.resolveRoles(nodePreset),
        };
        const templateContext: any = { ...presetData, ...generatedContext, ...nodePreset };
        const excludeFiles: string[] = [];

        // Exclude files depending on the enabled extensions. To complete...
        if (!templateContext.harvesting) {
            excludeFiles.push('config-harvesting.properties');
        }
        if (!templateContext.networkheight) {
            excludeFiles.push('config-networkheight.properties');
        }

        if (nodePreset.rewardProgram) {
            if (!nodePreset.host) {
                throw new Error(
                    `Cannot create reward program configuration. You need to provide a host field in preset: ${nodePreset.name}`,
                );
            }
            const restService = presetData.gateways?.find((g) => g.apiNodeName == nodePreset.name);
            if (!restService) {
                throw new Error(
                    `Cannot create reward program configuration. There is not rest gateway for the api node: ${nodePreset.name}`,
                );
            }

            const rewardProgram = RewardProgramUtils.getRewardProgram(nodePreset.rewardProgram);
            templateContext.restGatewayUrl = nodePreset.restGatewayUrl || `http://${restService.host || nodePreset.host}:3000`;
            templateContext.rewardProgram = rewardProgram;
            templateContext.serverVersion = nodePreset.serverVersion || presetData.serverVersion;
            templateContext.mainPublicKey = account.main.publicKey;
            const copyFrom = join(this.root, 'config', 'agent');
            const agentConfig = BootstrapUtils.getTargetNodesFolder(this.params.target, false, name, 'agent');
            await BootstrapUtils.generateConfiguration(templateContext, copyFrom, agentConfig, []);
        }

        const serverRecoveryConfig = {
            addressextractionRecovery: false,
            mongoRecovery: false,
            zeromqRecovery: false,
            filespoolingRecovery: true,
            hashcacheRecovery: true,
        };

        const brokerRecoveryConfig = {
            addressextractionRecovery: true,
            mongoRecovery: true,
            zeromqRecovery: true,
            filespoolingRecovery: false,
            hashcacheRecovery: true,
        };

        logger.info(`Generating ${name} server configuration`);
        await BootstrapUtils.generateConfiguration({ ...serverRecoveryConfig, ...templateContext }, copyFrom, serverConfig, excludeFiles);
        const peersP2PFile = await this.generateP2PFile(
            presetData,
            addresses,
            presetData.peersP2PListLimit,
            serverConfig,
            NodeType.PEER_NODE,
            (nodePresetData) => !!nodePresetData.syncsource && nodePresetData != nodePreset,
            'peers-p2p.json',
        );
        const peersApiFile = await this.generateP2PFile(
            presetData,
            addresses,
            presetData.peersApiListLimit,
            serverConfig,
            NodeType.API_NODE,
            (nodePresetData) => nodePresetData.api && nodePresetData != nodePreset,
            'peers-api.json',
        );

        if (nodePreset.brokerName) {
            logger.info(`Generating ${nodePreset.brokerName} broker configuration`);
            await BootstrapUtils.generateConfiguration(
                { ...brokerRecoveryConfig, ...templateContext },
                copyFrom,
                brokerConfig,
                excludeFiles,
            );
            copyFileSync(peersP2PFile, join(join(brokerConfig, 'resources', 'peers-p2p.json')));
            copyFileSync(peersApiFile, join(join(brokerConfig, 'resources', 'peers-api.json')));
        }

        await new VotingService(this.params).run(
            presetData,
            account,
            nodePreset,
            currentFinalizationEpoch,
            undefined,
            ConfigLoader.shouldCreateNemesis(this.root, presetData),
        );
    }

    private async generateP2PFile(
        presetData: ConfigPreset,
        addresses: Addresses,
        listLimit: number,
        outputFolder: string,
        type: NodeType,
        nodePresetDataFunction: (nodePresetData: NodePreset) => boolean,
        jsonFileName: string,
    ) {
        const thisNetworkKnownPeers = (presetData.nodes || [])
            .map((nodePresetData, index) => {
                if (!nodePresetDataFunction(nodePresetData)) {
                    return undefined;
                }
                const node = (addresses.nodes || [])[index];
                return {
                    publicKey: node.main.publicKey,
                    endpoint: {
                        host: nodePresetData.host || '',
                        port: 7900,
                    },
                    metadata: {
                        name: nodePresetData.friendlyName,
                        roles: ConfigLoader.resolveRoles(nodePresetData),
                    },
                };
            })
            .filter((i) => i);
        const globalKnownPeers = presetData.knownPeers?.[type] || [];
        const allPeers = [...thisNetworkKnownPeers, ...globalKnownPeers];
        const data = {
            _info: `this file contains a list of ${type} peers`,
            knownPeers: allPeers.length > listLimit ? _.sampleSize(allPeers, listLimit) : allPeers,
        };
        const peerFile = join(outputFolder, `resources`, jsonFileName);
        await fs.promises.writeFile(peerFile, JSON.stringify(data, null, 2));
        await fs.promises.chmod(peerFile, 0o600);
        return peerFile;
    }

    private async generateNemesisConfig(presetData: ConfigPreset, addresses: Addresses) {
        if (!presetData.nemesis) {
            throw new Error('nemesis must not be defined!');
        }
        const target = this.params.target;
        const nemesisWorkingDir = BootstrapUtils.getTargetNemesisFolder(target, false);
        const transactionsDirectory = join(nemesisWorkingDir, presetData.nemesis.transactionsDirectory || presetData.transactionsDirectory);
        await BootstrapUtils.mkdir(transactionsDirectory);
        const copyFrom = join(this.root, `config`, `nemesis`);
        const moveTo = join(nemesisWorkingDir, `server-config`);
        const templateContext = { ...(presetData as any), addresses };
        await Promise.all(
            (addresses.nodes || []).filter((n) => n.vrf).map((n) => this.createVrfTransaction(transactionsDirectory, presetData, n)),
        );

        await Promise.all(
            (addresses.nodes || [])
                .filter((n) => n.remote)
                .map((n) => this.createAccountKeyLinkTransaction(transactionsDirectory, presetData, n)),
        );

        await Promise.all((addresses.nodes || []).map((n) => this.createVotingKeyTransactions(transactionsDirectory, presetData, n)));

        if (presetData.nemesis.transactions) {
            const transactionHashes: string[] = [];
            const transactions = (
                await Promise.all(
                    Object.entries(presetData.nemesis.transactions || {})
                        .map(([key, payload]) => {
                            const transactionHash = Transaction.createTransactionHash(
                                payload,
                                Array.from(Convert.hexToUint8(presetData.nemesisGenerationHashSeed)),
                            );
                            if (transactionHashes.indexOf(transactionHash) > -1) {
                                logger.warn(`Transaction ${key} wth hash ${transactionHash} already exist. Excluded from folder.`);
                                return undefined;
                            }
                            transactionHashes.push(transactionHash);
                            return this.storeTransaction(transactionsDirectory, key, payload);
                        })
                        .filter((p) => p),
                )
            ).filter((p) => p);
            logger.info(`Found ${transactions.length} provided in transactions.`);
        }

        await BootstrapUtils.generateConfiguration(templateContext, copyFrom, moveTo);
        await new NemgenService(this.root, this.params).run(presetData);
    }

    private async createVrfTransaction(transactionsDirectory: string, presetData: ConfigPreset, node: NodeAccount): Promise<Transaction> {
        if (!node.vrf) {
            throw new Error('VRF keys should have been generated!!');
        }
        if (!node.main) {
            throw new Error('Main keys should have been generated!!');
        }
        const deadline = Deadline.createFromDTO('1');
        const vrf = VrfKeyLinkTransaction.create(deadline, node.vrf.publicKey, LinkAction.Link, presetData.networkType, UInt64.fromUint(0));
        const mainPrivateKey = await this.params.privateKeyResolver.resolvePrivateKey(
            presetData.networkType,
            node.main,
            KeyName.Main,
            node.name,
            'creating the vrf key link transactions',
        );
        const account = Account.createFromPrivateKey(mainPrivateKey, presetData.networkType);
        const signedTransaction = account.sign(vrf, presetData.nemesisGenerationHashSeed);
        return await this.storeTransaction(transactionsDirectory, `vrf_${node.name}`, signedTransaction.payload);
    }

    private async createAccountKeyLinkTransaction(
        transactionsDirectory: string,
        presetData: ConfigPreset,
        node: NodeAccount,
    ): Promise<Transaction> {
        if (!node.remote) {
            throw new Error('Remote keys should have been generated!!');
        }
        if (!node.main) {
            throw new Error('Main keys should have been generated!!');
        }
        const deadline = Deadline.createFromDTO('1');
        const akl = AccountKeyLinkTransaction.create(
            deadline,
            node.remote.publicKey,
            LinkAction.Link,
            presetData.networkType,
            UInt64.fromUint(0),
        );
        const mainPrivateKey = await this.params.privateKeyResolver.resolvePrivateKey(
            presetData.networkType,
            node.main,
            KeyName.Main,
            node.name,
            'creating the account link transactions',
        );
        const account = Account.createFromPrivateKey(mainPrivateKey, presetData.networkType);
        const signedTransaction = account.sign(akl, presetData.nemesisGenerationHashSeed);
        return await this.storeTransaction(transactionsDirectory, `remote_${node.name}`, signedTransaction.payload);
    }

    private async createVotingKeyTransactions(
        transactionsDirectory: string,
        presetData: ConfigPreset,
        node: NodeAccount,
    ): Promise<Transaction[]> {
        const votingFiles = node.voting || [];
        const mainPrivateKey = await this.params.privateKeyResolver.resolvePrivateKey(
            presetData.networkType,
            node.main,
            KeyName.Main,
            node.name,
            'creating the voting key link transactions',
        );
        return Promise.all(
            votingFiles.map(async (votingFile) => {
                const voting = VotingKeyLinkTransaction.create(
                    Deadline.createFromDTO('1'),
                    votingFile.publicKey,
                    votingFile.startEpoch,
                    votingFile.endEpoch,
                    LinkAction.Link,
                    presetData.networkType,
                    1,
                    UInt64.fromUint(0),
                );
                const account = Account.createFromPrivateKey(mainPrivateKey, presetData.networkType);
                const signedTransaction = account.sign(voting, presetData.nemesisGenerationHashSeed);
                return this.storeTransaction(transactionsDirectory, `voting_${node.name}`, signedTransaction.payload);
            }),
        );
    }

    private async storeTransaction(transactionsDirectory: string, name: string, payload: string): Promise<Transaction> {
        const transaction = TransactionMapping.createFromPayload(payload);
        await fs.promises.writeFile(`${transactionsDirectory}/${name}.bin`, Convert.hexToUint8(payload));
        return transaction as Transaction;
    }

    private generateGateways(presetData: ConfigPreset) {
        return Promise.all(
            (presetData.gateways || []).map(async (gatewayPreset, index: number) => {
                const copyFrom = join(this.root, 'config', 'rest-gateway');
                const generatedContext: Partial<GatewayConfigPreset> = {
                    restDeploymentToolVersion: BootstrapUtils.VERSION,
                    restDeploymentToolLastUpdatedDate: new Date().toISOString().slice(0, 10),
                };
                const templateContext = { ...generatedContext, ...presetData, ...gatewayPreset };
                const name = templateContext.name || `rest-gateway-${index}`;
                const moveTo = BootstrapUtils.getTargetGatewayFolder(this.params.target, false, name);
                await BootstrapUtils.generateConfiguration(templateContext, copyFrom, moveTo);
                const apiNodeConfigFolder = BootstrapUtils.getTargetNodesFolder(
                    this.params.target,
                    false,
                    gatewayPreset.apiNodeName,
                    'server-config',
                    'resources',
                );
                const apiNodeCertFolder = BootstrapUtils.getTargetNodesFolder(this.params.target, false, gatewayPreset.apiNodeName, 'cert');
                await BootstrapUtils.generateConfiguration(
                    {},
                    apiNodeConfigFolder,
                    join(moveTo, 'api-node-config'),
                    [],
                    ['config-network.properties', 'config-node.properties'],
                );
                await BootstrapUtils.generateConfiguration(
                    {},
                    apiNodeCertFolder,
                    join(moveTo, 'api-node-config', 'cert'),
                    [],
                    ['node.crt.pem', 'node.key.pem', 'ca.cert.pem'],
                );
            }),
        );
    }

    private generateExplorers(presetData: ConfigPreset) {
        return Promise.all(
            (presetData.explorers || []).map(async (explorerPreset, index: number) => {
                const copyFrom = join(this.root, 'config', 'explorer');
                const mosaicPreset = presetData.nemesis.mosaics[0];
                const fullName = `${presetData.baseNamespace}.${mosaicPreset.name}`;
                const namespaceId = new NamespaceId(fullName);
                const { restNodes, defaultNode } = this.resolveRests(presetData);
                const templateContext = {
                    namespaceName: fullName,
                    namespaceId: namespaceId.toHex(),
                    restNodes: restNodes,
                    defaultNode: defaultNode,
                    ...presetData,
                    ...explorerPreset,
                };
                const name = templateContext.name || `explorer-${index}`;
                const moveTo = BootstrapUtils.getTargetFolder(this.params.target, false, BootstrapUtils.targetExplorersFolder, name);
                await BootstrapUtils.generateConfiguration(templateContext, copyFrom, moveTo);
            }),
        );
    }

    private generateWallets(presetData: ConfigPreset) {
        return Promise.all(
            (presetData.wallets || []).map(async (walletPreset, index: number) => {
                const copyFrom = join(this.root, 'config', 'wallet');
                const { restNodes, defaultNode } = this.resolveRests(presetData);
                const templateContext = {
                    namespaceName: `${presetData.baseNamespace}.${presetData.nemesis.mosaics[0].name}`,
                    defaultNodeUrl: defaultNode,
                    restNodes: restNodes.map((url) => {
                        return { url: url, roles: 2, friendlyName: new URL(url).hostname };
                    }),
                    ...presetData,
                    ...walletPreset,
                };

                const name = templateContext.name || `wallet-${index}`;
                const moveTo = BootstrapUtils.getTargetFolder(this.params.target, false, BootstrapUtils.targetWalletsFolder, name);
                await BootstrapUtils.generateConfiguration(templateContext, copyFrom, moveTo);
                await fsPromises.chmod(join(moveTo, 'app.conf.js'), 0o777);
                await fsPromises.chmod(join(moveTo, 'fees.conf.js'), 0o777);
                await fsPromises.chmod(join(moveTo, 'network.conf.js'), 0o777);
                await fsPromises.chmod(join(moveTo, 'profileImporter.html'), 0o777);
                await Promise.all(
                    (walletPreset.profiles || []).map(async (profile) => {
                        if (!profile.name) {
                            throw new Error('Profile`s name must be provided in the wallets preset when creating wallet profiles.');
                        }
                        const profileJsonFileName = `wallet-profile-${profile.name}.json`;

                        const loadProfileData = async (): Promise<string> => {
                            if (profile.data) {
                                return JSON.stringify(profile.data, null, 2);
                            }
                            if (profile.location) {
                                return BootstrapUtils.loadFileAsText(profile.location);
                            }
                            return BootstrapUtils.loadFileAsText(profileJsonFileName);
                        };

                        try {
                            const profileData = await loadProfileData();
                            await BootstrapUtils.writeTextFile(join(moveTo, profileJsonFileName), profileData);
                        } catch (e) {
                            const message = `Cannot create Wallet profile with name '${profile.name}'. Do you have the file '${profileJsonFileName}' in the current folder?. ${e}`;
                            throw new Error(message);
                        }
                    }),
                );
            }),
        );
    }

    private resolveRests(presetData: ConfigPreset): { restNodes: string[]; defaultNode: string } {
        const restNodes: string[] = [];
        presetData.gateways?.forEach((restService) => {
            const nodePreset = presetData.nodes?.find((g) => g.name == restService.apiNodeName);
            restNodes.push(nodePreset?.restGatewayUrl || `http://${restService.host || nodePreset?.host || 'localhost'}:3000`);
        });
        if (presetData.knownRestGateways) {
            restNodes.push(...presetData.knownRestGateways);
        }
        return { restNodes: _.uniq(restNodes), defaultNode: restNodes[0] || 'http://localhost:3000' };
    }

    private cleanUpConfiguration(presetData: ConfigPreset) {
        const target = this.params.target;
        (presetData.nodes || []).forEach(({ name }) => {
            const serverConfigFolder = BootstrapUtils.getTargetNodesFolder(target, false, name, 'server-config');
            BootstrapUtils.deleteFolder(serverConfigFolder);

            const brokerConfigFolder = BootstrapUtils.getTargetNodesFolder(target, false, name, 'broker-config');
            BootstrapUtils.deleteFolder(brokerConfigFolder);

            // Remove old user configs when upgrading.
            const userConfigFolder = BootstrapUtils.getTargetNodesFolder(target, false, name, 'userconfig');
            BootstrapUtils.deleteFolder(userConfigFolder);

            const seedFolder = BootstrapUtils.getTargetNodesFolder(target, false, name, 'seed');
            BootstrapUtils.deleteFolder(seedFolder);
        });
        (presetData.gateways || []).forEach(({ name }) => {
            const configFolder = BootstrapUtils.getTargetGatewayFolder(target, false, name);
            BootstrapUtils.deleteFolder(configFolder);
        });
    }
}
