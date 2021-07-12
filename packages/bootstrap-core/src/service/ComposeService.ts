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

import { existsSync } from 'fs';
import * as _ from 'lodash';
import { join } from 'path';
import { Logger, LoggerFactory, LogType } from '../logger';
import { Addresses, ConfigPreset, DockerCompose, DockerComposeService, DockerServicePreset } from '../model';
import { BootstrapUtils } from './BootstrapUtils';
import { ConfigLoader } from './ConfigLoader';
// eslint-disable-next-line @typescript-eslint/no-var-requires
export type ComposeParams = { target: string; user?: string; upgrade?: boolean; password?: string };

const logger: Logger = LoggerFactory.getLogger(LogType.System);

const targetNodesFolder = BootstrapUtils.targetNodesFolder;
const targetDatabasesFolder = BootstrapUtils.targetDatabasesFolder;
const targetGatewaysFolder = BootstrapUtils.targetGatewaysFolder;
const targetExplorersFolder = BootstrapUtils.targetExplorersFolder;
const targetWalletsFolder = BootstrapUtils.targetWalletsFolder;

export interface PortConfiguration {
    internalPort: number;
    openPort: number | undefined | boolean | string;
}

export class ComposeService {
    public static defaultParams: ComposeParams = {
        target: BootstrapUtils.defaultTargetFolder,
        user: BootstrapUtils.CURRENT_USER,
        upgrade: false,
    };

    public static readonly DEBUG_SERVICE_PARAMS = {
        security_opt: ['seccomp:unconfined'],
        cap_add: ['ALL'],
        privileged: true,
    };

    private readonly configLoader: ConfigLoader;

    constructor(private readonly root: string, protected readonly params: ComposeParams) {
        this.configLoader = new ConfigLoader();
    }

    public resolveDebugOptions(dockerComposeDebugMode: boolean, dockerComposeServiceDebugMode: boolean | undefined): any {
        if (dockerComposeServiceDebugMode == false) {
            return {};
        }
        if (dockerComposeServiceDebugMode || dockerComposeDebugMode) {
            return ComposeService.DEBUG_SERVICE_PARAMS;
        }
        return {};
    }

    public async run(passedPresetData?: ConfigPreset, passedAddresses?: Addresses): Promise<DockerCompose> {
        const presetData = passedPresetData ?? this.configLoader.loadExistingPresetData(this.params.target, this.params.password || false);

        const currentDir = process.cwd();
        const target = join(currentDir, this.params.target);
        const targetDocker = join(target, `docker`);
        if (this.params.upgrade) {
            BootstrapUtils.deleteFolder(targetDocker);
        }
        const dockerFile = join(targetDocker, 'docker-compose.yml');
        if (existsSync(dockerFile)) {
            logger.info(dockerFile + ' already exist. Reusing. (run --upgrade to drop and upgrade)');
            return BootstrapUtils.loadYaml(dockerFile, false);
        }

        await BootstrapUtils.mkdir(targetDocker);
        await BootstrapUtils.generateConfiguration(presetData, join(this.root, 'config', 'docker'), targetDocker);

        await BootstrapUtils.chmodRecursive(join(targetDocker, 'mongo'), 0o666);

        const user: string | undefined = await BootstrapUtils.resolveDockerUserFromParam(this.params.user);

        const vol = (hostFolder: string, imageFolder: string, readOnly: boolean): string => {
            return `${hostFolder}:${imageFolder}:${readOnly ? 'ro' : 'rw'}`;
        };

        logger.info(`Creating docker-compose.yml from last used profile.`);

        const services: (DockerComposeService | undefined)[] = [];

        const resolvePorts = (portConfigurations: PortConfiguration[]): string[] => {
            return portConfigurations
                .filter((c) => c.openPort)
                .map(({ openPort, internalPort }) => {
                    if (openPort === true || openPort === 'true') {
                        return `${internalPort}:${internalPort}`;
                    }
                    return `${openPort}:${internalPort}`;
                });
        };

        const resolveService = async (
            servicePreset: DockerServicePreset,
            rawService: DockerComposeService,
        ): Promise<DockerComposeService> => {
            const service = { ...rawService };
            if (servicePreset.host || servicePreset.ipv4_address) {
                service.networks = { default: {} };
            }
            if (servicePreset.host) {
                service.hostname = servicePreset.host;
                service.networks!.default.aliases = [servicePreset.host];
            }
            if (servicePreset.environment) {
                service.environment = { ...servicePreset.environment, ...rawService.environment };
            }
            if (servicePreset.ipv4_address) {
                service.networks!.default.ipv4_address = servicePreset.ipv4_address;
            }
            return service;
        };

        await Promise.all(
            (presetData.databases || [])
                .filter((d) => !d.excludeDockerService)
                .map(async (n) => {
                    const databaseName = n.databaseName || presetData.databaseName;
                    const databasePort = 27017;
                    services.push(
                        await resolveService(n, {
                            user,
                            environment: { MONGO_INITDB_DATABASE: databaseName },
                            container_name: n.name,
                            image: presetData.mongoImage,
                            command: `mongod --dbpath=/dbdata --bind_ip=${n.name} ${presetData.mongoComposeRunParam}`,
                            stop_signal: 'SIGINT',
                            working_dir: '/docker-entrypoint-initdb.d',
                            ports: resolvePorts([{ internalPort: databasePort, openPort: n.openPort }]),
                            volumes: [
                                vol(`./mongo`, `/docker-entrypoint-initdb.d`, true),
                                vol(`../${targetDatabasesFolder}/${n.name}`, '/dbdata', false),
                            ],
                            ...this.resolveDebugOptions(presetData.dockerComposeDebugMode, n.dockerComposeDebugMode),
                            ...n.compose,
                        }),
                    );
                }),
        );

        const nodeWorkingDirectory = '/symbol-workdir';
        const nodeCommandsDirectory = '/symbol-commands';
        const nemesisSeed = presetData.seedDirectory;
        const restart = presetData.dockerComposeServiceRestart;
        await Promise.all(
            (presetData.nodes || [])
                .filter((d) => !d.excludeDockerService)
                .map(async (n) => {
                    const debugFlag = 'DEBUG';
                    const serverDebugMode = presetData.dockerComposeDebugMode || n.dockerComposeDebugMode ? debugFlag : 'NORMAL';
                    const brokerDebugMode = presetData.dockerComposeDebugMode || n.brokerDockerComposeDebugMode ? debugFlag : 'NORMAL';
                    const serverCommand = `/bin/bash ${nodeCommandsDirectory}/start.sh ${presetData.catapultAppFolder} ${
                        presetData.dataDirectory
                    } server broker ${n.name} ${serverDebugMode} ${!!n.brokerName}`;
                    const brokerCommand = `/bin/bash ${nodeCommandsDirectory}/start.sh ${presetData.catapultAppFolder} ${
                        presetData.dataDirectory
                    } broker server ${n.brokerName || 'broker'} ${brokerDebugMode}`;
                    const portConfigurations = [{ internalPort: 7900, openPort: n.openPort }];

                    const serverDependsOn: string[] = [];
                    const brokerDependsOn: string[] = [];

                    if (n.databaseHost) {
                        serverDependsOn.push(n.databaseHost);
                        brokerDependsOn.push(n.databaseHost);
                    }
                    if (n.brokerName) {
                        serverDependsOn.push(n.brokerName);
                    }
                    const volumes = [
                        vol(`../${targetNodesFolder}/${n.name}`, nodeWorkingDirectory, false),
                        vol(`./server`, nodeCommandsDirectory, true),
                        vol(`../nemesis/seed`, nodeWorkingDirectory + nemesisSeed.replace('./', '/'), true),
                    ];
                    const nodeService = await resolveService(n, {
                        user: serverDebugMode === debugFlag ? undefined : user, // if debug on, run as root
                        container_name: n.name,
                        image: presetData.symbolServerImage,
                        command: serverCommand,
                        stop_signal: 'SIGINT',
                        working_dir: nodeWorkingDirectory,
                        restart: restart,
                        ports: resolvePorts(portConfigurations),
                        volumes: volumes,
                        depends_on: serverDependsOn,
                        ...this.resolveDebugOptions(presetData.dockerComposeDebugMode, n.dockerComposeDebugMode),
                        ...n.compose,
                    });

                    services.push(nodeService);
                    if (n.brokerName) {
                        services.push(
                            await resolveService(
                                {
                                    ipv4_address: n.brokerIpv4_address,
                                    openPort: n.brokerOpenPort,
                                    excludeDockerService: n.brokerExcludeDockerService,
                                    host: n.brokerHost,
                                },
                                {
                                    user: brokerDebugMode === debugFlag ? undefined : user, // if debug on, run as root
                                    container_name: n.brokerName,
                                    image: nodeService.image,
                                    working_dir: nodeWorkingDirectory,
                                    command: brokerCommand,
                                    ports: resolvePorts([{ internalPort: 7902, openPort: n.brokerOpenPort }]),
                                    stop_signal: 'SIGINT',
                                    restart: restart,
                                    volumes: nodeService.volumes,
                                    depends_on: brokerDependsOn,
                                    ...this.resolveDebugOptions(presetData.dockerComposeDebugMode, n.brokerDockerComposeDebugMode),
                                    ...n.brokerCompose,
                                },
                            ),
                        );
                    }

                    if (n.rewardProgram) {
                        const volumes = [vol(`../${targetNodesFolder}/${n.name}/agent`, nodeWorkingDirectory, false)];

                        const rewardProgramAgentCommand = `/app/agent-linux.bin --config agent.properties`;
                        services.push(
                            await resolveService(
                                {
                                    ipv4_address: n.rewardProgramAgentIpv4_address,
                                    openPort: n.rewardProgramAgentOpenPort,
                                    excludeDockerService: n.rewardProgramAgentExcludeDockerService,
                                    host: n.rewardProgramAgentHost,
                                },
                                {
                                    user: user,
                                    container_name: n.name + '-agent',
                                    image: presetData.symbolAgentImage,
                                    working_dir: nodeWorkingDirectory,
                                    entrypoint: rewardProgramAgentCommand,
                                    ports: resolvePorts([
                                        {
                                            internalPort: n.rewardProgramAgentPort || presetData.rewardProgramAgentPort,
                                            openPort: _.isUndefined(n.rewardProgramAgentOpenPort) ? true : n.rewardProgramAgentOpenPort,
                                        },
                                    ]),
                                    stop_signal: 'SIGINT',
                                    restart: restart,
                                    volumes: volumes,
                                    ...this.resolveDebugOptions(
                                        presetData.dockerComposeDebugMode,
                                        n.rewardProgramAgentDockerComposeDebugMode,
                                    ),
                                    ...n.rewardProgramAgentCompose,
                                },
                            ),
                        );
                    }
                }),
        );

        await Promise.all(
            (presetData.gateways || [])
                .filter((d) => !d.excludeDockerService)
                .map(async (n) => {
                    const internalPort = 3000;
                    const volumes = [vol(`../${targetGatewaysFolder}/${n.name}`, nodeWorkingDirectory, false)];
                    services.push(
                        await resolveService(n, {
                            container_name: n.name,
                            user,
                            image: presetData.symbolRestImage,
                            command: 'npm start --prefix /app/catapult-rest/rest /symbol-workdir/rest.json',
                            stop_signal: 'SIGINT',
                            working_dir: nodeWorkingDirectory,
                            ports: resolvePorts([{ internalPort: internalPort, openPort: n.openPort }]),
                            restart: restart,
                            volumes: volumes,
                            depends_on: [n.databaseHost],
                            ...this.resolveDebugOptions(presetData.dockerComposeDebugMode, n.dockerComposeDebugMode),
                            ...n.compose,
                        }),
                    );
                }),
        );

        await Promise.all(
            (presetData.wallets || [])
                .filter((d) => !d.excludeDockerService)
                .map(async (n) => {
                    const volumes = [vol(`../${targetWalletsFolder}/${n.name}`, '/usr/share/nginx/html/config', true)];
                    services.push(
                        await resolveService(n, {
                            container_name: n.name,
                            image: presetData.symbolWalletImage,
                            stop_signal: 'SIGINT',
                            working_dir: nodeWorkingDirectory,
                            ports: resolvePorts([{ internalPort: 80, openPort: n.openPort }]),
                            restart: restart,
                            volumes: volumes,
                            ...this.resolveDebugOptions(presetData.dockerComposeDebugMode, n.dockerComposeDebugMode),
                            ...n.compose,
                        }),
                    );
                }),
        );

        await Promise.all(
            (presetData.explorers || [])
                .filter((d) => !d.excludeDockerService)
                .map(async (n) => {
                    const volumes = [
                        vol(`../${targetExplorersFolder}/${n.name}`, nodeWorkingDirectory, true),
                        vol(`./explorer`, nodeCommandsDirectory, true),
                    ];
                    const entrypoint = `ash -c "/bin/ash ${nodeCommandsDirectory}/run.sh ${n.name}"`;
                    services.push(
                        await resolveService(n, {
                            container_name: n.name,
                            image: presetData.symbolExplorerImage,
                            entrypoint: entrypoint,
                            stop_signal: 'SIGINT',
                            working_dir: nodeWorkingDirectory,
                            ports: resolvePorts([{ internalPort: 4000, openPort: n.openPort }]),
                            restart: restart,
                            volumes: volumes,
                            ...this.resolveDebugOptions(presetData.dockerComposeDebugMode, n.dockerComposeDebugMode),
                            ...n.compose,
                        }),
                    );
                }),
        );

        await Promise.all(
            (presetData.faucets || [])
                .filter((d) => !d.excludeDockerService)
                .map(async (n) => {
                    const mosaicPreset = presetData.nemesis.mosaics[0];
                    const fullName = `${presetData.baseNamespace}.${mosaicPreset.name}`;
                    // const nemesisPrivateKey = addresses?.mosaics?[0]?/;
                    services.push(
                        await resolveService(n, {
                            container_name: n.name,
                            image: presetData.symbolFaucetImage,
                            stop_signal: 'SIGINT',
                            environment: {
                                NATIVE_CURRENCY_NAME: n.environment?.NATIVE_CURRENCY_NAME || fullName,
                                FAUCET_PRIVATE_KEY:
                                    n.environment?.FAUCET_PRIVATE_KEY || this.getMainAccountPrivateKey(passedAddresses) || '',
                                NATIVE_CURRENCY_ID: BootstrapUtils.toSimpleHex(
                                    n.environment?.NATIVE_CURRENCY_ID || presetData.currencyMosaicId || '',
                                ),
                            },
                            restart: restart,
                            ports: resolvePorts([{ internalPort: 4000, openPort: n.openPort }]),
                            depends_on: [n.gateway],
                            ...this.resolveDebugOptions(presetData.dockerComposeDebugMode, n.dockerComposeDebugMode),
                            ...n.compose,
                        }),
                    );
                }),
        );

        const validServices: DockerComposeService[] = services.filter((s) => s).map((s) => s as DockerComposeService);
        const servicesMap: Record<string, DockerComposeService> = _.keyBy(validServices, 'container_name');
        let dockerCompose: DockerCompose = {
            version: presetData.dockerComposeVersion,
            services: servicesMap,
        };

        if (presetData.subnet)
            dockerCompose.networks = {
                default: {
                    ipam: {
                        config: [
                            {
                                subnet: presetData.subnet,
                            },
                        ],
                    },
                },
            };

        dockerCompose = BootstrapUtils.pruneEmpty(dockerCompose);
        await BootstrapUtils.writeYaml(dockerFile, dockerCompose, undefined);
        logger.info(`The docker-compose.yml file created ${dockerFile}`);
        return dockerCompose;
    }

    private getMainAccountPrivateKey(passedAddresses: Addresses | undefined) {
        const addresses = passedAddresses ?? this.configLoader.loadExistingAddresses(this.params.target, this.params.password);
        return addresses?.mosaics?.[0]?.accounts[0].privateKey;
    }
}
