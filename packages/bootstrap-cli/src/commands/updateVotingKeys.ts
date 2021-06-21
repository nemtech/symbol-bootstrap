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
import { IOptionFlag } from '@oclif/command/lib/flags';
import { IBooleanFlag } from '@oclif/parser/lib/flags';
import {
    BootstrapUtils,
    ConfigLoader,
    CryptoUtils,
    Logger,
    LoggerFactory,
    LogType,
    RemoteNodeService,
    VotingService,
} from 'symbol-bootstrap-core';
import { CommandUtils } from '../service';

const logger: Logger = LoggerFactory.getLogger(LogType.System);

export default class UpdateVotingKeys extends Command {
    static description = `It updates the voting files containing the voting keys when required.

If the node's current voting file has an end epoch close to the current network epoch, this command will create a new 'private_key_treeX.dat' that continues the current file.

By default, bootstrap creates a new voting file once the current file reaches its last month. The current network epoch is resolved from the network or you can provide it with the \`finalizationEpoch\` param.

When a new voting file is created, Bootstrap will advise running the \`link\` command again.

`;

    static examples = [`$ symbol-bootstrap updateVotingKeys`];

    static flags: {
        help: IBooleanFlag<void>;
        target: IOptionFlag<string>;
        user: IOptionFlag<string>;
        finalizationEpoch: IOptionFlag<number | undefined>;
    } = {
        help: CommandUtils.helpFlag,
        target: CommandUtils.targetFlag,
        user: flags.string({
            char: 'u',
            description: `User used to run docker images when creating the the voting key files. "${BootstrapUtils.CURRENT_USER}" means the current user.`,
            default: BootstrapUtils.CURRENT_USER,
        }),
        finalizationEpoch: flags.integer({
            description: `The network's finalization epoch. It can be retrieved from the /chain/info rest endpoint. If not provided, the bootstrap known epoch is used.`,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(UpdateVotingKeys);
        CommandUtils.showBanner();
        const password = false;
        const target = flags.target;
        const configLoader = new ConfigLoader();
        const addressesLocation = configLoader.getGeneratedAddressLocation(target);
        const presetData = configLoader.loadExistingPresetData(target, password);
        const addresses = configLoader.loadExistingAddresses(target, password);
        const privateKeySecurityMode = CryptoUtils.getPrivateKeySecurityMode(presetData.privateKeySecurityMode);

        const finalizationEpoch =
            flags.finalizationEpoch || (await new RemoteNodeService().resolveCurrentFinalizationEpoch(presetData, false));

        const votingKeyUpgrade = (
            await Promise.all(
                (presetData.nodes || []).map((nodePreset, index) => {
                    const nodeAccount = addresses.nodes?.[index];
                    if (!nodeAccount) {
                        throw new Error(`There is not node in addresses at index ${index}`);
                    }
                    return new VotingService({
                        target,
                        user: flags.user,
                    }).run(presetData, nodeAccount, nodePreset, finalizationEpoch, true, false);
                }),
            )
        ).find((f) => f);
        if (votingKeyUpgrade) {
            await BootstrapUtils.writeYaml(
                addressesLocation,
                CryptoUtils.removePrivateKeysAccordingToSecurityMode(addresses, privateKeySecurityMode),
                undefined,
            );
            logger.warn('Bootstrap has created new voting file(s). Review the logs!');
            logger.warn('');
        } else {
            logger.info('');
            logger.info('Voting files are up-to-date. There is nothing to upgrade');
            logger.info('');
        }
    }
}
