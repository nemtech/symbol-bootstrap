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

import { Command, flags } from '@oclif/command';
import { IBooleanFlag, IOptionFlag } from '@oclif/parser/lib/flags';
import { LoggerFactory, LogType } from 'symbol-bootstrap-core';
import { NetworkGenesisService, NetworkUtils } from 'symbol-network-core';
import { NetworkCommandUtils } from '../utils';

export default class GenerateNemesis extends Command {
    static description = `This "one-time" command is the third step when creating a new network after running the "expandNodes" command.

This step is only required when you are creating a new network, if you are creating a node cluster of an existing network you can skip this step and go directly to the "configureNodes" command.

After running this command, your new network nemesis seed would be created. It also generates a dummy node that you can run to try before deploying it into production.
`;

    static examples = [`$ ${NetworkCommandUtils.CLI_TOOL} generateNemesis`];

    static flags: {
        help: IBooleanFlag<void>;
        regenerate: IBooleanFlag<boolean>;
        password: IOptionFlag<string | undefined>;
        noPassword: IBooleanFlag<boolean>;
    } = {
        help: NetworkCommandUtils.helpFlag,
        regenerate: flags.boolean({
            description: 'To regenerate the nemesis block. This will drop the existing nemesis block and node configuration',
            default: false,
        }),
        password: NetworkCommandUtils.passwordFlag,
        noPassword: NetworkCommandUtils.noPasswordFlag,
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(GenerateNemesis);
        NetworkCommandUtils.showBanner();
        const logger = LoggerFactory.getLogger(LogType.Console);
        const outputFile = NetworkUtils.DEFAULT_NETWORK_FILE;
        const inputFile = NetworkUtils.DEFAULT_NETWORK_FILE;
        const regenerate = flags.regenerate;
        const accountStorage = await NetworkCommandUtils.createStorage(flags, logger);
        const nemesisTargetFolder = await new NetworkGenesisService(logger, accountStorage).generateNemesis(
            inputFile,
            outputFile,
            regenerate,
        );
        logger.info('');
        logger.info('');
        logger.info(`The ${outputFile} file has been updated!`);
        logger.info('');
        logger.info('Nemesis block has been generated. To verify the block using a demo box run:');
        logger.info('');
        logger.info(`$ symbol-bootstrap start -t ${nemesisTargetFolder} --noPassword --detached --healthCheck --report`);
        logger.info('');
        logger.info(`Try the demo node by going to:`);
        logger.info(' - Rest Accounts - http://localhost:3000/accounts');
        logger.info(' - Rest Mosaics - http://localhost:3000/mosaics');
        logger.info(' - Rest Confirmed Transactions - http://localhost:3000/transactions/confirmed');
        logger.info(' - Rest Chain Info - http://localhost:3000/chain/info');
        logger.info(' - Rest Node Info - http://localhost:3000/node/info');
        logger.info(' - Web Wallet - http://localhost:80');
        logger.info(' - Explorer - http://localhost:90');
        logger.info(' - Faucet - http://localhost:100');
        logger.info('');
        logger.info('To stop the demo node:');
        logger.info('');
        logger.info(`$ symbol-bootstrap stop -t ${nemesisTargetFolder}`);
        logger.info('');
        logger.info(`Once you are happy, run:`);
        logger.info('');
        logger.info(`$ ${NetworkCommandUtils.CLI_TOOL} configureNodes`);
        logger.info('');
        logger.info(`To generate the nodes' configuration ready to be deployed.`);
    }
}
