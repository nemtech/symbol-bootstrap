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

import { Command } from '@oclif/command';
import { IBooleanFlag, IOptionFlag } from '@oclif/parser/lib/flags';
import { LoggerFactory, LogType } from 'symbol-bootstrap-core';
import { NetworkConfigurationService, NetworkUtils } from 'symbol-network-core';
import { NetworkCommandUtils } from '../utils';

export default class ExpandNodes extends Command {
    static description = `This "one-time" command is the second step configuring the node cluster for an existing an network or a new network.

After running the 'init' command and you have revisited the '${NetworkUtils.DEFAULT_NETWORK_INPUT_FILE}' files, you can run this command to convert the list of node types to the final list of nodes you want to create saved in the initial '${NetworkUtils.DEFAULT_NETWORK_FILE}' file.

`;

    static examples = [`$ ${NetworkCommandUtils.CLI_TOOL} expandNodes`];

    static flags: {
        help: IBooleanFlag<void>;
        password: IOptionFlag<string | undefined>;
        noPassword: IBooleanFlag<boolean>;
    } = {
        help: NetworkCommandUtils.helpFlag,
        password: NetworkCommandUtils.passwordFlag,
        noPassword: NetworkCommandUtils.noPasswordFlag,
    };

    public async run(): Promise<void> {
        NetworkCommandUtils.showBanner();
        const inputFile = NetworkUtils.DEFAULT_NETWORK_INPUT_FILE;
        const outputFile = NetworkUtils.DEFAULT_NETWORK_FILE;
        const logger = LoggerFactory.getLogger(LogType.Console);
        const { flags } = this.parse(ExpandNodes);
        const accountStorage = await NetworkCommandUtils.createStorage(flags, logger);
        const service = await new NetworkConfigurationService(logger, accountStorage);
        const output = await service.expandNodes(inputFile, outputFile);
        logger.info('');
        logger.info(`The ${outputFile} has been saved!`);
        logger.info('');
        if (output.isNewNetwork) {
            logger.info('');
            logger.info(
                `Revisit the ${NetworkUtils.DEFAULT_NETWORK_INPUT_FILE}. You can tune a node's property like the hostname or friendly name.`,
            );
            logger.info('');
            logger.info('You can also run:');
            logger.info('');
            logger.info(`$ ${NetworkCommandUtils.CLI_TOOL} displayResolvedNetworkPreset`);
            logger.info('');
            logger.info(
                `To display the network preset to be used. You can tune it by updating ${NetworkUtils.DEFAULT_NETWORK_PRESET_FILE} `,
            );

            logger.info('');
            logger.info('Once happy, run:');
            logger.info('');
            logger.info(`$ ${NetworkCommandUtils.CLI_TOOL} generateNemesis`);
            logger.info('');
            logger.info(
                'To generate the nemesis node based on the initial nodes you have defined. The nodes will be fully linked and funded from block 1!. ',
            );
        } else {
            logger.info('');
            logger.info(
                `Revisit the ${NetworkUtils.DEFAULT_NETWORK_INPUT_FILE} changing any node tunning you wan to do, for example a hostname or friendly name.`,
            );
            logger.info('');
            logger.info('Once happy, run:');
            logger.info('');
            logger.info(`$ ${NetworkCommandUtils.CLI_TOOL} configureNodes`);
            logger.info('');
            logger.info(`To generate the nodes' configuration.`);
        }
    }
}
