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

import { Command, flags } from '@oclif/command';
import { existsSync } from 'fs';
import { prompt } from 'inquirer';
import { dirname, join } from 'path';
import { BootstrapService, BootstrapUtils, CommandUtils, CryptoUtils, ZipItem, ZipUtils } from '../service';
import Clean from './clean';
import Compose from './compose';
import Config from './config';

export default class Pack extends Command {
    static description = 'It configures and packages your node into a zip file that can be uploaded to the final node machine.';

    static examples = [
        `$ symbol-bootstrap pack`,
        `$ symbol-bootstrap pack -p bootstrap -c custom-preset.yml`,
        `$ symbol-bootstrap pack -p testnet -a dual -c custom-preset.yml`,
        `$ symbol-bootstrap pack -p mainnet -a dual --password 1234 -c custom-preset.yml`,
        `$ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap pack -p mainnet -a dual -c custom-preset.yml`,
    ];

    static flags = {
        ...Compose.flags,
        ...Clean.flags,
        ...Config.resolveFlags(true),
        ready: flags.boolean({
            description: 'If --ready is provided, the command will not ask offline confirmation.',
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(Pack);
        BootstrapUtils.showBanner();
        const preset = flags.preset;
        const assembly = flags.assembly;
        const targetZip = join(dirname(flags.target), `${preset}-${assembly || 'default'}-node.zip`);

        if (existsSync(targetZip)) {
            throw new Error(
                `The target zip file ${targetZip} already exist. Do you want to delete it before repackaging your target folder?`,
            );
        }
        console.log();
        console.log();
        if (
            !flags.ready &&
            !(
                await prompt([
                    {
                        name: 'offlineNow',
                        message: `Symbol Bootstrap is about to start working with sensitive information (certificates and voting file generation) so it is highly recommended that you disconnect from the network before continuing. Say YES if you are offline or if you don't care.`,
                        type: 'confirm',
                        default: true,
                    },
                ])
            ).offlineNow
        ) {
            console.log('Come back when you are offline...');
            return;
        }

        flags.password = await CommandUtils.resolvePassword(
            flags.password,
            flags.noPassword,
            CommandUtils.passwordPromptDefaultMessage,
            true,
        );
        const service = await new BootstrapService(this.config.root);
        const configOnlyCustomPresetFileName = 'config-only-custom-preset.yml';
        const configResult = await service.config(flags);
        await service.compose(flags, configResult.presetData);

        const noPrivateKeyTempFile = 'custom-preset-temp.temp';

        if (flags.customPreset) {
            await BootstrapUtils.writeYaml(
                noPrivateKeyTempFile,
                CryptoUtils.removePrivateKeys(BootstrapUtils.loadYaml(flags.customPreset, flags.password)),
                flags.password,
            );
        } else {
            await BootstrapUtils.writeYaml(noPrivateKeyTempFile, {}, flags.password);
        }
        const zipItems: ZipItem[] = [
            {
                from: flags.target,
                to: 'target',
                directory: true,
            },
            {
                from: noPrivateKeyTempFile,
                to: configOnlyCustomPresetFileName,
                directory: false,
            },
        ];

        await ZipUtils.zip(targetZip, zipItems);
        await BootstrapUtils.deleteFile(noPrivateKeyTempFile);
        console.log();
        console.log(`Zip file ${targetZip} has been created. You can unzip it in your node's machine and run:`);
        console.log(`$ symbol-bootstrap start -p ${preset}${assembly ? ` -a ${assembly}` : ''} -c ${configOnlyCustomPresetFileName}`);
    }
}
