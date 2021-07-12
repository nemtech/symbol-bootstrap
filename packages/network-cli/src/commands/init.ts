import { Command, flags } from '@oclif/command';
import { IOptionFlag } from '@oclif/command/lib/flags';
import { IBooleanFlag } from '@oclif/parser/lib/flags';
import { existsSync } from 'fs';
import { prompt } from 'inquirer';
import { BootstrapUtils, ConfigLoader, LoggerFactory, LogType, NemesisPreset, Preset } from 'symbol-bootstrap-core';
import {
    AwsNodeData,
    AwsNodeSize,
    DeploymentType,
    Network,
    NetworkConfigurationService,
    NetworkInputFile,
    NetworkUtils,
    NodeMetadataType,
    nodesAwsMetadata,
    nodesMetadata,
    NodeTypeInput,
    Region,
    toDescription,
    toNetworkType,
} from 'symbol-network-core';
import { Account, NetworkType } from 'symbol-sdk';
import { NetworkCommandUtils } from '../utils';

export default class Init extends Command {
    static description = `This command is the first step configuring the node cluster for an existing an network or a new network.

It's prompt style wizard that asks a series of questions to start defining your nodes. The ouput of this command is a file containing a list of node types you want to create.

This is a "one time" command that will kick the network setup process. Please follow the instructions on the screen.

This commands creates the initial '${NetworkUtils.DEFAULT_NETWORK_INPUT_FILE}' and '${NetworkUtils.DEFAULT_NETWORK_PRESET_FILE}' files.
`;

    static examples = [`$ ${NetworkCommandUtils.CLI_TOOL} init`];

    static flags: {
        help: IBooleanFlag<void>;
        ready: IBooleanFlag<boolean>;
        password: IOptionFlag<string | undefined>;
        noPassword: IBooleanFlag<boolean>;
    } = {
        help: NetworkCommandUtils.helpFlag,
        ready: flags.boolean({
            description: `if --read is provided, the won't ask for confirmations`,
            default: false,
        }),
        password: NetworkCommandUtils.passwordFlag,
        noPassword: NetworkCommandUtils.noPasswordFlag,
    };

    async run(): Promise<void> {
        const { flags } = this.parse(Init);
        NetworkCommandUtils.showBanner();
        const ready = flags.ready;
        const networkInputFile = NetworkUtils.DEFAULT_NETWORK_INPUT_FILE;
        const root = BootstrapUtils.DEFAULT_ROOT_FOLDER;
        const customNetworkPresetFile = NetworkUtils.DEFAULT_NETWORK_PRESET_FILE;
        const logger = LoggerFactory.getLogger(LogType.Console);

        console.log();
        console.log(`Welcome to the ${NetworkCommandUtils.CLI_TOOL} tool. `);
        console.log();
        console.log('This tool will allow you creating a new network or a node cluster for an existing network.');

        console.log();
        console.log('First you need to decide if you are creating a new network or creating nodes to join an existing network.');
        console.log();

        const isNewNetwork = await Init.confirm('Are you creating a new network?');
        if (isNewNetwork) {
            console.log();
            console.log(
                'The new network will be based on an existing network. You can select an out-of-the box preset from Symbol Bootstrap or you can provide a custom network preset to be based one',
            );
            console.log();
        } else {
            console.log();
            console.log('The new nodes can join an existing public network or you can provide the custom network`s preset and seed.');
            console.log();
        }

        const { preset, nemesisSeedFolder } = await Init.promptPreset(isNewNetwork);

        const domain = await Init.promptDomain('Domain', 'Enter the domain to be used to be used in your nodes', 'mycompany.com', ready);

        const suffix = await Init.promptName('Suffix', `Enter a suffix for node generated domain names and urls`, 'myc', ready);

        const networkPreset = ConfigLoader.loadNetworkPreset(root, preset);
        const nemesisPreset = networkPreset.nemesis as NemesisPreset;
        if (!nemesisPreset) throw new Error('Network nemesis must be found!');
        if (!nemesisPreset.mosaics) throw new Error(`Network nemesis's mosaics must be found!`);

        let faucetBalances: number[] | undefined;
        if (isNewNetwork) {
            const accountStorage = await NetworkCommandUtils.createStorage(flags, logger);
            const network = await Init.promptNetwork("What's the network type you want to create?", Network.privateTest);
            const networkType = await toNetworkType(network);
            const networkDescription = await Init.promptDescription(
                'Network Name',
                `Enter a name for the network.`,
                `My Company ${toDescription(network)} Network`,
                ready,
            );

            const nemesisGenerationHashSeed = await Init.generateRandomKey(
                'Generation Hash Seed',
                'Enter the generation hash seed to identify the network',
                networkType,
                ready,
            );

            const epochAdjustment = await Init.promptNumber(
                'Epoch Adjustment',
                'Enter the epoch adjustment value to offset deadlines.',
                Math.floor(Date.now() / 1000),
                ready,
            );

            networkPreset.baseNamespace = await Init.promptName(
                'Network basename Alias',
                'Enter the basename for the network aliases',
                networkPreset.baseNamespace,
                ready,
            );

            for (const [index, mosaic] of nemesisPreset.mosaics.entries()) {
                const currencyType = index == 0 ? 'Network' : index == 1 ? 'Harvest' : 'Custom';
                mosaic.name = await Init.promptName(
                    `${currencyType} Currency Name`,
                    `Enter the alias for the ${currencyType} Currency`,
                    mosaic.name,
                    ready,
                );
            }

            const nemesisSignerAccount = await Init.promptPrivateKey(networkType, 'Nemesis Signer Account', ready);
            await accountStorage.saveNetworkAccount(networkType, 'nemesisSigner', nemesisSignerAccount.privateKey);

            const founderAccount = await Init.promptPrivateKey(networkType, 'Founder Account', ready);
            await accountStorage.saveNetworkAccount(networkType, 'founder', founderAccount.privateKey);
            faucetBalances = [];
            if (await Init.confirm('Do you want to have a Faucet account?')) {
                const founderAccount = await Init.promptPrivateKey(networkType, 'Faucet Account', ready);
                await accountStorage.saveNetworkAccount(networkType, 'faucet', founderAccount.privateKey);

                for (const mosaic of nemesisPreset.mosaics) {
                    const balance = await Init.promptNumber(
                        'Balance',
                        `What's the initial ${mosaic.name} balance for the Faucet Account ${founderAccount.address.plain()}?`,
                        Math.floor(mosaic.supply / 100 / Math.pow(10, mosaic.divisibility)) * 5,
                        ready,
                    );
                    faucetBalances.push(balance);
                }
            }

            const harvestNetworkFeeSinkAccount = await Init.promptPrivateKey(networkType, 'Harvest Network Fee Sink Account', ready);
            await accountStorage.saveNetworkAccount(networkType, 'harvestNetworkFeeSink', harvestNetworkFeeSinkAccount.privateKey);

            const namespaceRentalFeeSinkAccount = await Init.promptPrivateKey(networkType, 'Namespace Rental Fee Sink Account', ready);
            await accountStorage.saveNetworkAccount(networkType, 'namespaceRentalFeeSink', namespaceRentalFeeSinkAccount.privateKey);

            const mosaicRentalFeeSinkAccount = await Init.promptPrivateKey(networkType, 'Mosaic Rental Fee Sink Account', ready);
            await accountStorage.saveNetworkAccount(networkType, 'mosaicRentalFeeSink', mosaicRentalFeeSinkAccount.privateKey);

            const rewardProgramControllerApiUrl = (await Init.confirm('Do you want to host the node Reward Program?'))
                ? await Init.promptUrl(
                      'Reward Controller URL',
                      'Enter the full url of the Reward Controller',
                      `http://${suffix}-node-monitoring.${domain}:7890`,
                      ready,
                  )
                : undefined;

            if (rewardProgramControllerApiUrl) {
                const rewardProgramEnrollmentAccount = await Init.promptPrivateKey(networkType, 'Reward Program Enrollment Account', ready);
                await accountStorage.saveNetworkAccount(networkType, 'rewardProgramEnrollment', rewardProgramEnrollmentAccount.privateKey);
            }

            await NetworkConfigurationService.updateNetworkPreset(
                {
                    networkDescription,
                    networkType,
                    nemesisGenerationHashSeed,
                    epochAdjustment,
                    rewardProgramControllerApiUrl,
                },
                accountStorage,
                networkPreset,
            );
            await BootstrapUtils.writeYaml(customNetworkPresetFile, networkPreset, undefined);
            console.log();
            console.log(
                `The initial network preset ${customNetworkPresetFile} for the new network has been stored. This file will be updated in the following steps.`,
            );
            console.log();
        }

        const nemesisGenerationHashSeed = networkPreset.nemesisGenerationHashSeed;
        const epochAdjustment = networkPreset.epochAdjustment?.replace('s', '');
        const deploymentType = await Init.promptDeploymentType();
        const nodeTypes = await Init.promptNodeTypeInputList(nemesisPreset, deploymentType, ready);
        const networkType = networkPreset.networkType;
        const networkDescription = networkPreset.networkDescription;
        if (!networkType) {
            throw new Error('networkType must be resolved!');
        }
        if (!epochAdjustment) {
            throw new Error('epochAdjustment must be resolved!');
        }
        if (!nemesisGenerationHashSeed) {
            throw new Error('nemesisGenerationHashSeed must be resolved!');
        }
        if (!networkDescription) {
            throw new Error('networkDescription must be resolved!');
        }
        const networkInput: NetworkInputFile = {
            preset: isNewNetwork ? customNetworkPresetFile : preset,
            domain: domain,
            suffix: suffix,
            networkDescription: networkDescription,
            networkType: networkType,
            nemesisGenerationHashSeed: nemesisGenerationHashSeed,
            epochAdjustment: parseInt(epochAdjustment),
            rewardProgramControllerApiUrl: networkPreset.rewardProgramControllerApiUrl,
            isNewNetwork: isNewNetwork,
            deploymentData: {
                type: deploymentType,
            },
            faucetBalances: faucetBalances,
            nemesisSeedFolder: nemesisSeedFolder,
            nodeTypes: nodeTypes,
        };

        await BootstrapUtils.writeYaml(networkInputFile, networkInput, undefined);
        console.log();
        console.log(`You have created the initial ${networkInputFile}. Have a look and once once you are happy, run: `);
        console.log();
        console.log(`$ ${NetworkCommandUtils.CLI_TOOL} expandNodes`);
        console.log();
    }

    public static async confirm(question: string, defaultValue = true): Promise<boolean> {
        const { value } = await prompt([
            {
                name: 'value',
                message: question,
                type: 'confirm',
                default: defaultValue,
            },
        ]);
        return value;
    }

    public static async promptPreset(isNewNetwork: boolean): Promise<{ preset: string; nemesisSeedFolder?: string }> {
        const message = isNewNetwork
            ? 'Select the Bootstrap profile to base your new network from:'
            : 'Select the Bootstrap profile for your nodes:';
        let preset: string = Preset.mainnet;
        let customFile = NetworkUtils.DEFAULT_NETWORK_PRESET_FILE;
        let nemesisSeedFolder = 'nemesis-seed';
        while (true) {
            const choices = (isNewNetwork ? Object.values(Preset) : [Preset.testnet, Preset.mainnet]).map((e) => {
                return {
                    name: `${NetworkUtils.startCase(e)} Preset`,
                    value: e.toString(),
                };
            });
            choices.push({
                name: `Custom Preset (${customFile} file will be asked)`,
                value: 'custom',
            });
            const networkResponse = await prompt([
                {
                    name: 'value',
                    message: message,
                    type: 'list',
                    default: preset,
                    choices: choices,
                },
            ]);
            preset = networkResponse.value;
            if (preset === 'custom') {
                const customPresetResponse = await prompt([
                    {
                        name: 'value',
                        message: "Enter the filename of the the custom network's preset:",
                        default: customFile,
                        validate(input: string): boolean | string {
                            if (!BootstrapUtils.isYmlFile(input)) {
                                return 'is not a YAML file';
                            }
                            return true;
                        },
                        type: 'input',
                    },
                ]);

                customFile = customPresetResponse.value;
                if (!existsSync(customFile)) {
                    console.log();
                    console.log(`Network file '${customFile}' does not exist! Please re-enter`);
                    console.log();
                    continue;
                }
                if (isNewNetwork) {
                    return { preset: customFile };
                }
                const nemesisSeedFolderResponse = await prompt([
                    {
                        name: 'value',
                        message: 'Enter the folder name where the custom network seed can be found:',
                        default: nemesisSeedFolder,
                        type: 'input',
                    },
                ]);
                nemesisSeedFolder = nemesisSeedFolderResponse.value;
                try {
                    await BootstrapUtils.validateSeedFolder(nemesisSeedFolder, '');
                } catch (e) {
                    console.log();
                    console.log(`Network nemesis seed '${nemesisSeedFolder}' is not valid! Please re-enter: Error: ${e.message}`);
                    console.log();
                    continue;
                }
                return {
                    preset: customFile,
                    nemesisSeedFolder: nemesisSeedFolder,
                };
            }
            return { preset: preset };
        }
    }

    public static async promptNetwork(message: string, defaultNetwork: Network): Promise<Network> {
        const responses = await prompt([
            {
                name: 'network',
                message: message,
                type: 'list',
                default: defaultNetwork,
                choices: Object.values(Network).map((e) => {
                    return {
                        name: toDescription(e),
                        value: e,
                    };
                }),
            },
        ]);
        return responses.network;
    }

    public static async promptDeploymentType(): Promise<DeploymentType> {
        const responses = await prompt([
            {
                name: 'deploymentType',
                message: 'Select the cloud provided for the deployment',
                type: 'list',
                default: DeploymentType.AWS,
                choices: Object.values(DeploymentType).map((e) => {
                    return {
                        name: e,
                        value: e,
                    };
                }),
            },
        ]);
        return responses.deploymentType;
    }

    public static async promptAwsRegion(message: string): Promise<Region> {
        const responses = await prompt([
            {
                name: 'region',
                message,
                type: 'list',
                default: Region['us-east-1'],
                choices: Object.values(Region).map((e) => {
                    return {
                        name: e,
                        value: e,
                    };
                }),
            },
        ]);
        return responses.region;
    }

    public static async promptAwsNodeSize(message: string, defaultNodeSize: AwsNodeSize | undefined): Promise<AwsNodeSize> {
        const responses = await prompt([
            {
                name: 'region',
                message,
                type: 'list',
                default: defaultNodeSize,
                choices: Object.values(AwsNodeSize).map((e) => {
                    return {
                        name: e,
                        value: e,
                    };
                }),
            },
        ]);
        return responses.region;
    }

    public static async promptNodeTypeInputList(
        nemesis: NemesisPreset,
        deploymentType: DeploymentType,
        ready: boolean,
    ): Promise<NodeTypeInput[]> {
        const list: NodeTypeInput[] = [];
        while (true) {
            console.log();
            console.log();
            const nodeType = await this.promptNodeType(`Select the node type you want to create`);
            const nodeTypeName = nodesMetadata[nodeType].name;
            const { total } = await prompt([
                {
                    name: 'total',
                    message: `How many nodes of type ${nodeTypeName} do you want to create?`,
                    type: 'number',
                    validate: (input) => {
                        if (!input) {
                            return 'is required';
                        }
                        if (input < 0) {
                            return 'number must not be negative';
                        }
                        return true;
                    },
                    default: 3,
                },
            ]);

            const balances: number[] = [];
            if (!nemesis) {
                throw new Error('Nemesis must be resolved!');
            }
            for (const [index, mosaic] of nemesis.mosaics.entries()) {
                const balance = await this.promptNumber(
                    'Balance',
                    `What's the initial ${mosaic.name} balance for the ${nodeTypeName} nodes?`,
                    nodesMetadata[nodeType].balances[index],
                    ready,
                );
                balances.push(balance);
            }

            const nickName = await Init.promptName(
                `Nodes's Nick Name`,
                'The nick name of the these nodes',
                nodesMetadata[nodeType].nickName,
                ready,
            );
            let awsNodeData: Partial<AwsNodeData> | undefined;
            if (deploymentType == DeploymentType.AWS) {
                const region = await Init.promptAwsRegion('Select the region for these nodes');
                const nodeSize = await Init.promptAwsNodeSize('The ec2 size for these images', nodesAwsMetadata[nodeType].nodeSize);

                const rootBlockSize = await Init.promptNumber(
                    'Root Block Size',
                    'Enter the AWS ec2 volume size in GB',
                    nodesAwsMetadata[nodeType].rootBlockSize,
                    ready,
                );
                awsNodeData = {
                    nodeSize,
                    region,
                    rootBlockSize,
                };
            }

            const { confirmCreate } = await prompt([
                {
                    default: true,
                    message: `Do you want to create ${total} nodes of type ${nodeTypeName} each with balance of ${balances.join(', ')}?`,
                    type: 'confirm',
                    name: 'confirmCreate',
                },
            ]);
            if (confirmCreate) {
                list.push({
                    nickName: nickName,
                    nodeType: nodeType,
                    balances: balances,
                    total: total,
                    ...awsNodeData,
                });
            }
            const { confirmCreateMore } = await prompt([
                {
                    default: true,
                    message: `Do you want to create more nodes?`,
                    type: 'confirm',
                    name: 'confirmCreateMore',
                },
            ]);
            if (!confirmCreateMore) {
                return list;
            }
        }
    }

    public static async promptNodeType(message: string): Promise<NodeMetadataType> {
        const responses = await prompt([
            {
                name: 'value',
                message: message,
                type: 'list',
                choices: Object.values(NodeMetadataType).map((e) => {
                    return {
                        name: nodesMetadata[e].name,
                        value: e,
                    };
                }),
            },
        ]);
        return responses.value;
    }

    public static async promptPrivateKey(networkType: NetworkType, fieldName: string, ready: boolean): Promise<Account> {
        return this.confirmedPrompt<Account>(
            fieldName,
            async (currentValue): Promise<Account> => {
                const { value } = await prompt([
                    {
                        name: 'value',
                        message: `Enter the 64 HEX private key ${fieldName} (or press enter to accept the auto generated):`,
                        type: 'password',
                        mask: '*',
                        default: currentValue?.privateKey,
                        validate: BootstrapUtils.isValidPrivateKey,
                    },
                ]);
                return Account.createFromPrivateKey(value, networkType);
            },
            Account.generateNewAccount(networkType),
            ready,
            (enteredAccount) => `address ${enteredAccount.address.plain()} public key ${enteredAccount.publicKey}`,
        );
    }

    public static async generateRandomKey(fieldName: string, message: string, networkType: NetworkType, ready: boolean): Promise<string> {
        return this.promptText(
            fieldName,
            message,
            Account.generateNewAccount(networkType).privateKey,
            ready,
            BootstrapUtils.isValidPrivateKey,
        );
    }
    public static async promptName(fieldName: string, message: string, defaultValue: string | undefined, ready: boolean): Promise<string> {
        return this.promptText(fieldName, message, defaultValue, ready, Init.isValidName);
    }

    public static async promptDescription(
        fieldName: string,
        message: string,
        defaultValue: string | undefined,
        ready: boolean,
    ): Promise<string> {
        return this.promptText(fieldName, message, defaultValue, ready, Init.isValidDescription);
    }

    public static async promptDomain(
        fieldName: string,
        message: string,
        defaultValue: string | undefined,
        ready: boolean,
    ): Promise<string> {
        return this.promptText(fieldName, message, defaultValue, ready, Init.isValidDomain);
    }

    public static async promptNumber(
        fieldName: string,
        message: string,
        defaultValue: number | undefined,
        ready: boolean | undefined,
    ): Promise<number> {
        return this.confirmedPrompt(
            fieldName,
            async (currentValue) => {
                const { value } = await prompt([
                    {
                        name: 'value',
                        message: message,
                        type: 'number',
                        default: currentValue,
                        validate(input: any): boolean | string {
                            if (input === undefined) {
                                return 'is required';
                            }
                            if (input < 0) {
                                return 'must not be negative';
                            }
                            return true;
                        },
                    },
                ]);
                return value;
            },
            defaultValue,
            ready,
        );
    }

    public static async promptUrl(
        fieldName: string,
        message: string,
        defaultValue: string | undefined,
        ready: boolean | undefined,
    ): Promise<string> {
        return this.promptText(fieldName, message, defaultValue, ready, Init.isValidUrl);
    }

    public static async promptText(
        fieldName: string,
        message: string,
        defaultValue: string | undefined,
        ready: boolean | undefined,
        validate?: (input: any) => boolean | string | Promise<boolean | string>,
    ): Promise<string> {
        return this.confirmedPrompt(
            fieldName,
            async (currentValue) => {
                const { value } = await prompt([
                    {
                        name: 'value',
                        message: message,
                        type: 'input',
                        default: currentValue,
                        validate: validate,
                    },
                ]);
                return value;
            },
            defaultValue,
            ready,
        );
    }

    public static async confirmedPrompt<T>(
        fieldName: string,
        valuePrompt: (defaultValue: T | undefined) => Promise<T>,
        defaultValue: T | undefined,
        ready: boolean | undefined,
        toString: (o: T) => string = (o: T) => `${o}`,
    ): Promise<T> {
        let value = defaultValue;
        while (true) {
            value = await valuePrompt(value);
            if (ready) {
                return value;
            }
            const { confirm } = await prompt([
                {
                    default: true,
                    message: `Is the ${fieldName} ${toString(value)} correct?`,
                    type: 'confirm',
                    name: 'confirm',
                },
            ]);
            if (confirm) {
                return value;
            }
            console.log(`Please re-enter the ${fieldName}.`);
        }
    }

    public static isValidName(input: string): boolean | string {
        if (!input) {
            return 'Must be provided';
        }
        if (input.match(/^[A-Za-z]+$/)) return true;
        else {
            return `${input} is not a valid name`;
        }
    }

    public static isValidDescription(input: string): boolean | string {
        if (!input) {
            return 'Must be provided';
        }
        if (input.match(/^[a-z\d\-_\s]+$/i)) return true;
        else {
            return `${input} is not a valid description text`;
        }
    }

    public static isValidDomain(input: string): boolean | string {
        const expression = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;

        if (!input) {
            return 'Must be provided';
        }
        if (input.match(expression)) return true;
        else {
            return `${input} is not a valid domain`;
        }
    }

    public static isValidUrl(input: string): boolean | string {
        const expression =
            /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;

        if (!input) {
            return 'Must be provided';
        }
        if (input.match(expression)) return true;
        else {
            return `${input} is not a valid url`;
        }
    }
}
