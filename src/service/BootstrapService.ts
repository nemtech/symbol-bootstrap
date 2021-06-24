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

import { Addresses, ConfigPreset, DockerCompose } from '../model';
import { BootstrapUtils } from './BootstrapUtils';
import { ComposeParams, ComposeService } from './ComposeService';
import { ConfigParams, ConfigResult, ConfigService } from './ConfigService';
import { LinkParams, LinkService } from './LinkService';
import { ReportParams, ReportService } from './ReportService';
import { RewardProgramParams, RewardProgramService } from './RewardProgramService';
import { RunParams, RunService } from './RunService';

export type StartParams = ConfigParams & ComposeParams & RunParams;

/**
 * Main entry point for API integration.
 */
export class BootstrapService {
    public constructor(private readonly root: string = BootstrapUtils.DEFAULT_ROOT_FOLDER) {}

    /**
     * It generates the configuration and nemesis for the provided preset
     *
     * @param config the params of the config command.
     */
    public async config(config: ConfigParams = ConfigService.defaultParams): Promise<ConfigResult> {
        return new ConfigService(this.root, config).run();
    }

    /**
     * It resolves the preset used for preventive configuration.
     *
     * @param config the params of the config command.
     */
    public resolveConfigPreset(config: ConfigParams = ConfigService.defaultParams): ConfigPreset {
        return new ConfigService(this.root, config).resolveConfigPreset(false);
    }

    /**
     * It generates the docker-compose.yaml file from the previously generated configuration.
     *
     * The config method/command needs to be called before this method
     *
     * @param config the params of the compose command.
     * @param passedPresetData the created preset if you know it, otherwise will load the latest one resolved from the target folder.
     * @param passedAddresses the created addresses if you know if, otherwise will load the latest one resolved form the target folder.
     */
    public compose(
        config: ComposeParams = ComposeService.defaultParams,
        passedPresetData?: ConfigPreset,
        passedAddresses?: Addresses,
    ): Promise<DockerCompose> {
        return new ComposeService(this.root, config).run(passedPresetData, passedAddresses);
    }

    /**
     * It calls a running server announcing all the node transactions like VRF and Voting.
     *
     * This command is useful to link the nodes keys to an existing running network like testnet.
     *
     * @param config the params passed
     * @param passedPresetData  the created preset if you know it, otherwise will load the latest one resolved from the target folder.
     * @param passedAddresses  the created addresses if you know it, otherwise will load the latest one resolved from the target folder.
     */

    public async link(
        config: LinkParams = LinkService.defaultParams,
        passedPresetData?: ConfigPreset | undefined,
        passedAddresses?: Addresses | undefined,
    ): Promise<void> {
        await new LinkService(config).run(passedPresetData, passedAddresses);
    }

    /**
     * It calls a running service announcing the registration of the nodes to the supernode rewards program.
     *
     * @param config the params passed
     * @param passedPresetData  the created preset if you know it, otherwise will load the latest one resolved from the target folder.
     * @param passedAddresses  the created addresses if you know it, otherwise will load the latest one resolved from the target folder.
     */
    public async enrollRewardProgram(
        config: RewardProgramParams = RewardProgramService.defaultParams,
        passedPresetData?: ConfigPreset | undefined,
        passedAddresses?: Addresses | undefined,
    ): Promise<void> {
        await new RewardProgramService(config).enroll(passedPresetData, passedAddresses);
    }

    /**
     * It generates reStructuredText (.rst) reports describing the configuration of each node.
     *
     * The config method/command needs to be called before this method
     *
     * @param config the params of the report command.
     * @param passedPresetData the created preset if you know if, otherwise will load the latest one resolved from the target folder.
     * @return the paths of the created reports.
     */
    public async report(config: ReportParams = ReportService.defaultParams, passedPresetData?: ConfigPreset): Promise<string[]> {
        return await new ReportService(this.root, config).run(passedPresetData);
    }

    /**
     * It boots the network via docker using the generated docker-compose.yml file and configuration
     *
     * The config and compose methods/commands need to be called before this method.
     *
     * This is just a wrapper for docker-compose up bash call.
     *
     * @param config the params of the run command.
     */
    public async run(config: RunParams = RunService.defaultParams): Promise<void> {
        await new RunService(config).run();
    }

    /**
     * It resets the data keeping generated configuration, block 1, certificates and keys.
     *
     * @param config the params of the clean command.
     */
    public async resetData(config = { target: RunService.defaultParams.target }): Promise<void> {
        await new RunService(config).resetData();
    }

    /**
     * It checks if the health of the running services is ok.
     *
     * @param config the params of the clean command.
     */
    public async healthCheck(config = { target: RunService.defaultParams.target }): Promise<void> {
        await new RunService(config).healthCheck();
    }

    /**
     * This method aggregates config, compose and run all in one.
     *
     * @param config the aggregated params in order to run all the sub commands.
     */
    public async start(config: StartParams): Promise<ConfigResult> {
        const configResult = await this.config(config);
        await this.compose(config, configResult.presetData);
        await this.run(config);
        return configResult;
    }

    /**
     * It stops the docker-compose network if running.
     *
     * This is just a wrapper for docker-compose down bash call.
     *
     * @param config the params necessary to detect and stop the network.
     */
    public async stop(config: RunParams = RunService.defaultParams): Promise<void> {
        await new RunService(config).stop();
    }
}
