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
import { existsSync } from 'fs';
import { dirname } from 'path';
import { BootstrapUtils, KnownError, Logger, LoggerFactory, LogType } from 'symbol-bootstrap-core';
import { CommandUtils } from '../service/CommandUtils';
const logger: Logger = LoggerFactory.getLogger(LogType.System);

export default class Decrypt extends Command {
    static description = `It decrypts a yml file using the provided password. The source file can be a custom preset file, a preset.yml file or an addresses.yml.

The main use case of this command is to verify private keys in encrypted files after encrypting a custom preset or running a bootstrap command with a provided --password.`;

    static examples = [
        `
$ symbol-bootstrap start --password 1234 --preset testnet --assembly dual --customPreset decrypted-custom-preset.yml --detached
$ symbol-bootstrap decrypt --password 1234 --source target/addresses.yml --destination plain-addresses.yml
$ symbol-bootstrap decrypt --password 1234 --source encrypted-custom-preset.yml --destination plain-custom-preset.yml
$ cat plain-addresses.yml
$ cat plain-custom-preset.yml
$ rm plain-addresses.yml
$ rm plain-custom-preset.yml
        `,

        `
$ symbol-bootstrap start --preset testnet --assembly dual --customPreset decrypted-custom-preset.yml --detached
> password prompt
$ symbol-bootstrap decrypt --source target/addresses.yml --destination plain-addresses.yml
> password prompt (enter the same password)
$ symbol-bootstrap decrypt --source encrypted-custom-preset.yml --destination plain-custom-preset.yml
> password prompt (enter the same password)
$ cat plain-addresses.yml
$ cat plain-custom-preset.yml
$ rm plain-addresses.yml
$ rm plain-custom-preset.yml`,
        `
$ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap decrypt --source target/addresses.yml --destination plain-addresses.yml
`,
    ];

    static flags = {
        help: CommandUtils.helpFlag,
        source: flags.string({
            description: `The source encrypted yml file to be decrypted.`,
            required: true,
        }),
        destination: flags.string({
            description: `The destination decrypted file to create. The destination file must not exist.`,
            required: true,
        }),
        password: CommandUtils.getPasswordFlag(
            `The password to use to decrypt the source file into the destination file. Bootstrap prompts for a password by default, can be provided in the command line (--password=XXXX) or disabled in the command line (--noPassword).`,
        ),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(Decrypt);

        if (!existsSync(flags.source)) {
            throw new KnownError(`Source file ${flags.source} does not exist!`);
        }
        if (existsSync(flags.destination)) {
            throw new KnownError(`Destination file ${flags.destination} already exists!`);
        }
        const password = await CommandUtils.resolvePassword(
            flags.password,
            false,
            `Enter the password to use to decrypt the source file into the destination file. Keep this password in a secure place!`,
            false,
        );
        const data = await BootstrapUtils.loadYaml(flags.source, password);
        await BootstrapUtils.mkdir(dirname(flags.destination));
        await BootstrapUtils.writeYaml(flags.destination, data, '');
        logger.info(
            `Decrypted file ${flags.destination} has been created! Any private keys on this file are now in plain text. Remember to remove the file!`,
        );
    }
}
