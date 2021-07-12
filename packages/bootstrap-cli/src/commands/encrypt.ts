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
import { BootstrapUtils, CryptoUtils, KnownError, Logger, LoggerFactory, LogType } from 'symbol-bootstrap-core';
import { CommandUtils } from '../service';
const logger: Logger = LoggerFactory.getLogger(LogType.System);

export default class Encrypt extends Command {
    static description = `It encrypts a yml file using the provided password. The source files would be a custom preset file, a preset.yml file or an addresses.yml.

The main use case of this command is encrypting custom presets files. If your custom preset contains private keys, it's highly recommended to encrypt it and use provide --password when starting or configuring the node with Bootstrap.`;

    static examples = [
        `
$ symbol-bootstrap encrypt --source plain-custom-preset.yml --destination encrypted-custom-preset.yml
> password prompt
$ symbol-bootstrap start --preset testnet --assembly dual --customPreset encrypted-custom-preset.yml
> password prompt (enter the same password)
        `,
        `
$ symbol-bootstrap encrypt --password 1234 --source plain-custom-preset.yml --destination encrypted-custom-preset.yml
$ symbol-bootstrap start --password 1234 --preset testnet --assembly dual --customPreset encrypted-custom-preset.yml
`,
        `
 $ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap encrypt --source plain-custom-preset.yml --destination encrypted-custom-preset.yml
 `,
    ];

    static flags = {
        help: CommandUtils.helpFlag,
        source: flags.string({
            description: `The source plain yml file to be encrypted. If this file is encrypted, the command will raise an error.`,
            required: true,
        }),
        destination: flags.string({
            description: `The destination encrypted file to create. The destination file must not exist.`,
            required: true,
        }),
        password: CommandUtils.getPasswordFlag(
            `The password to use to encrypt the source file into the destination file. Bootstrap prompts for a password by default, can be provided in the command line (--password=XXXX) or disabled in the command line (--noPassword).`,
        ),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(Encrypt);

        if (!existsSync(flags.source)) {
            throw new KnownError(`Source file ${flags.source} does not exist!`);
        }
        if (existsSync(flags.destination)) {
            throw new KnownError(`Destination file ${flags.destination} already exists!`);
        }
        const password = await CommandUtils.resolvePassword(
            flags.password,
            false,
            `Enter the password used to decrypt the source file into the destination file. Keep this password in a secure place!`,
            false,
        );
        const data = await BootstrapUtils.loadYaml(flags.source, false);
        if (CryptoUtils.encryptedCount(data) > 0) {
            throw new KnownError(`Source file ${flags.source} is already encrypted. If you want to decrypt it use the decrypt command.`);
        }
        await BootstrapUtils.mkdir(dirname(flags.destination));
        await BootstrapUtils.writeYaml(flags.destination, data, password);
        logger.info(`Encrypted file ${flags.destination} has been created!`);
    }
}
