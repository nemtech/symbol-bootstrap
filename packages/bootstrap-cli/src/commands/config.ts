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
import { BootstrapService, BootstrapUtils, ConfigService } from 'symbol-bootstrap-core';
import { CommandUtils } from '../service/CommandUtils';
export default class Config extends Command {
    static description = 'Command used to set up the configuration files and the nemesis block for the current network';

    static examples = [
        `$ symbol-bootstrap config -p dualCurrency -a demo`,
        `$ symbol-bootstrap config -p testnet -a dual --password 1234`,
        `$ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap config -p testnet -a dual`,
    ];

    static flags: {
        help: IBooleanFlag<void>;
        password: IOptionFlag<string | undefined>;
        noPassword: IBooleanFlag<boolean>;
        upgrade: IBooleanFlag<boolean>;
        user: IOptionFlag<string>;
        preset: IOptionFlag<string | undefined>;
        assembly: IOptionFlag<string | undefined>;
        customPreset: IOptionFlag<string | undefined>;
        reset: IBooleanFlag<boolean>;
        report: IBooleanFlag<boolean>;
        target: IOptionFlag<string>;
    } = {
        help: CommandUtils.helpFlag,
        target: CommandUtils.targetFlag,
        password: CommandUtils.passwordFlag,
        noPassword: CommandUtils.noPasswordFlag,
        preset: flags.string({
            char: 'p',
            description: `The network preset. It can be provided via custom preset or cli parameter. ${'If not provided, the value is resolved from the target/preset.yml file.'}`,
        }),
        assembly: flags.string({
            char: 'a',
            description: `The assembly that define the node(s) layout. It can be provided via custom preset or cli parameter. ${'If not provided, the value is resolved from the target/preset.yml file.'}`,
        }),
        customPreset: flags.string({
            char: 'c',
            description: `External preset file. Values in this file will override the provided presets.`,
        }),
        reset: flags.boolean({
            char: 'r',
            description: 'It resets the configuration generating a new one.',
            default: ConfigService.defaultParams.reset,
        }),

        upgrade: flags.boolean({
            description: `It regenerates the configuration reusing the previous keys. Use this flag when upgrading the version of bootstrap to keep your node up to date without dropping the local data. Backup the target folder before upgrading.`,
            default: ConfigService.defaultParams.reset,
        }),

        report: flags.boolean({
            description: 'It generates reStructuredText (.rst) reports describing the configuration of each node.',
            default: ConfigService.defaultParams.report,
        }),

        user: flags.string({
            char: 'u',
            description: `User used to run docker images when creating configuration files like certificates or nemesis block. "${BootstrapUtils.CURRENT_USER}" means the current user.`,
            default: BootstrapUtils.CURRENT_USER,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(Config);
        CommandUtils.showBanner();
        flags.password = await CommandUtils.resolvePassword(
            flags.password,
            flags.noPassword,
            CommandUtils.passwordPromptDefaultMessage,
            true,
        );
        await new BootstrapService().config({ ...flags, privateKeyResolver: CommandUtils });
    }
}
