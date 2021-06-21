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
import { flags } from '@oclif/command';
import { IOptionFlag } from '@oclif/command/lib/flags';
import { IBooleanFlag } from '@oclif/parser/lib/flags';
import { textSync } from 'figlet';
import { prompt } from 'inquirer';
import { BootstrapUtils, CertificatePair, KeyName, Logger, LoggerFactory, LogType } from 'symbol-bootstrap-core';
import { Account, NetworkType, PublicAccount } from 'symbol-sdk';

const logger: Logger = LoggerFactory.getLogger(LogType.System);

export class CommandUtils {
    public static passwordPromptDefaultMessage = `Enter the password used to encrypt and decrypt custom presets, addresses.yml, and preset.yml files. When providing a password, private keys will be encrypted. Keep this password in a secure place!`;
    public static helpFlag: IBooleanFlag<void> = flags.help({ char: 'h', description: 'It shows the help of this command.' });

    public static targetFlag: IOptionFlag<string> = flags.string({
        char: 't',
        description: 'The target folder where the symbol-bootstrap network is generated',
        default: BootstrapUtils.defaultTargetFolder,
    });

    public static passwordFlag: IOptionFlag<string | undefined> = CommandUtils.getPasswordFlag(
        `A password used to encrypt and decrypt private keys in preset files like addresses.yml and preset.yml. Bootstrap prompts for a password by default, can be provided in the command line (--password=XXXX) or disabled in the command line (--noPassword).`,
    );

    public static noPasswordFlag: IBooleanFlag<boolean> = flags.boolean({
        description: 'When provided, Bootstrap will not use a password, so private keys will be stored in plain text. Use with caution.',
        default: false,
    });

    public static showBanner(): void {
        console.log(textSync('symbol-bootstrap', { horizontalLayout: 'fitted' }));
    }

    public static getPasswordFlag(description: string): IOptionFlag<string | undefined> {
        return flags.string({
            description: description,
            parse(input: string): string {
                const result = !input || CommandUtils.isValidPassword(input);
                if (result === true) return input;
                throw new Error(`--password is invalid, ${result}`);
            },
        });
    }

    public static isValidPassword(input: string | undefined): boolean | string {
        if (!input || input === '') {
            return true;
        }
        if (input.length >= 4) return true;
        return `Password must have at least 4 characters but got ${input.length}`;
    }

    public static async resolvePrivateKey(
        networkType: NetworkType,
        account: CertificatePair | undefined,
        keyName: KeyName,
        nodeName: string,
        operationDescription: string,
    ): Promise<string> {
        if (!account) {
            return '';
        }
        if (!account.privateKey) {
            while (true) {
                console.log();
                console.log(`${keyName} private key is required when ${operationDescription}.`);
                const address = PublicAccount.createFromPublicKey(account.publicKey, networkType).address.plain();
                const nodeDescription = nodeName === '' ? `of` : `of the Node's '${nodeName}'`;
                const responses = await prompt([
                    {
                        name: 'value',
                        message: `Enter the 64 HEX private key ${nodeDescription} ${keyName} account with Address: ${address} and Public Key: ${account.publicKey}:`,
                        type: 'password',
                        mask: '*',
                        validate: BootstrapUtils.isValidPrivateKey,
                    },
                ]);
                const privateKey = responses.value === '' ? undefined : responses.value.toUpperCase();
                if (!privateKey) {
                    console.log('Please provide the private key.');
                } else {
                    const enteredAccount = Account.createFromPrivateKey(privateKey, networkType);
                    if (enteredAccount.publicKey.toUpperCase() !== account.publicKey.toUpperCase()) {
                        console.log(
                            `Invalid private key. Expected address is ${address} but you provided the private key for address ${enteredAccount.address.plain()}.\n`,
                        );
                        console.log(`Please re-enter private key.`);
                    } else {
                        account.privateKey = privateKey;
                        return privateKey;
                    }
                }
            }
        }
        return account.privateKey.toUpperCase();
    }

    public static async resolvePassword(
        providedPassword: string | undefined,
        noPassword: boolean,
        message: string,
        log: boolean,
    ): Promise<string | undefined> {
        if (!providedPassword) {
            if (noPassword) {
                if (log) logger.warn(`Password has not been provided (--noPassword)! It's recommended to use one for security!`);
                return undefined;
            }
            const responses = await prompt([
                {
                    name: 'password',
                    mask: '*',
                    message: message,
                    type: 'password',
                    validate: CommandUtils.isValidPassword,
                },
            ]);
            if (responses.password === '' || !responses.password) {
                if (log) logger.warn(`Password has not been provided (empty text)! It's recommended to use one for security!`);
                return undefined;
            }
            if (log) logger.info(`Password has been provided`);
            return responses.password;
        }
        if (log) logger.info(`Password has been provided`);
        return providedPassword;
    }
}
