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
import { Command } from '@oclif/command';
import { IBooleanFlag } from '@oclif/parser/lib/flags';
import { existsSync } from 'fs';
import { BootstrapUtils, ConfigLoader, LoggerFactory, LogType } from 'symbol-bootstrap-core';
import { NetworkUtils } from 'symbol-network-core';
import { NetworkCommandUtils } from '../utils';

export class DisplayResolvedNetworkPreset extends Command {
    static description = `It displays the resolved network preset (Bootstrap's shared + ${NetworkUtils.DEFAULT_NETWORK_PRESET_FILE}).

This command it's useful to review the configuration on of your new network. Any customization to be performed can be done by upgrading or adding the properties to the ${NetworkUtils.DEFAULT_NETWORK_PRESET_FILE} file.

It's recommended you only add the customizations for your network in the final  ${NetworkUtils.DEFAULT_NETWORK_PRESET_FILE}.
    `;

    static examples = [`$ ${NetworkCommandUtils.CLI_TOOL} displayResolvedNetworkPreset`];

    static flags: {
        help: IBooleanFlag<void>;
    } = {
        help: NetworkCommandUtils.helpFlag,
    };

    public async run(): Promise<void> {
        NetworkCommandUtils.showBanner();
        if (!existsSync(NetworkUtils.DEFAULT_NETWORK_PRESET_FILE)) {
            throw new Error(
                `${NetworkUtils.DEFAULT_NETWORK_PRESET_FILE} does not exist. Have you executed the 'init' command? Are you creating a new network?`,
            );
        }
        const configLoader = new ConfigLoader();
        const logger = LoggerFactory.getLogger(LogType.Console);
        const shared = ConfigLoader.loadSharedPreset(BootstrapUtils.DEFAULT_ROOT_FOLDER);
        const network = BootstrapUtils.loadYaml(NetworkUtils.DEFAULT_NETWORK_PRESET_FILE, undefined);
        const merged = configLoader.mergePresets(shared, network);
        logger.info('');
        logger.info('Resolved Network Preset:');
        logger.info('');
        logger.info('------');
        logger.info('');
        logger.info(BootstrapUtils.toYaml(merged));
        logger.info('------');
        logger.info('');
        logger.info(
            `You can tune your network by adding or updating the displayed properties into ${NetworkUtils.DEFAULT_NETWORK_PRESET_FILE} file`,
        );
        logger.info('');
    }
}
