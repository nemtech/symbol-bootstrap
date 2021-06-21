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

import { expect, test } from '@oclif/test';
import { BootstrapUtils, CryptoUtils } from 'symbol-bootstrap-core';

describe('encrypt', () => {
    test.add('remove target', () => BootstrapUtils.deleteFolder('target/tests.encrypt'))
        .stdout()
        .command('encrypt --source test/encrypt/plain.yml --destination target/tests.encrypt/encrypted.yml --password 1111'.split(' '))
        .it('runs encrypt and creates file', async (ctx) => {
            expect(ctx.stdout).to.contain('Encrypted file target/tests.encrypt/encrypted.yml has been created!');
            expect(await BootstrapUtils.loadYaml('target/tests.encrypt/encrypted.yml', '1111')).deep.eq(
                await BootstrapUtils.loadYaml('test/encrypt/encrypted.yml', '1111'),
            );
            expect(CryptoUtils.encryptedCount(await BootstrapUtils.loadYaml('target/tests.encrypt/encrypted.yml', false))).eq(
                CryptoUtils.encryptedCount(await BootstrapUtils.loadYaml('test/encrypt/encrypted.yml', false)),
            );
        });

    test.add('remove target', () => BootstrapUtils.deleteFolder('target/tests.encrypt'))
        .stdout()
        .command('encrypt --source test/encrypt/plain.yml --destination target/tests.encrypt/encrypted.yml --password 1'.split(' '))
        .catch((ctx) => {
            expect(ctx.message).to.contain('--password is invalid, Password must have at least 4 characters but got 1');
        })
        .it('password too short');

    test.add('remove target', () => BootstrapUtils.deleteFolder('target/tests.encrypt'))
        .stdout()
        .command('encrypt --source test/encrypt/encrypted.yml --destination target/tests.encrypt/encrypted.yml --password 1111'.split(' '))
        .catch((ctx) => {
            expect(ctx.message).to.contain(
                'Source file test/encrypt/encrypted.yml is already encrypted. If you want to decrypt it use the decrypt command.',
            );
        })
        .it('already encrypted');

    test.add('remove target', () => BootstrapUtils.deleteFolder('target/tests.encrypt'))
        .stdout()
        .command('encrypt --source test/encrypt/plain.yml --destination test/encrypt/plain.yml --password 1111'.split(' '))
        .catch((ctx) => {
            expect(ctx.message).to.contain('Destination file test/encrypt/plain.yml already exists!');
        })
        .it('same destination');
});
