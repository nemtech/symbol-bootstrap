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

describe('decrypt', () => {
    test.add('remove target', () => BootstrapUtils.deleteFolder('target/tests.encrypt'))
        .stdout()
        .command('decrypt --source test/encrypt/encrypted.yml --destination target/tests.encrypt/plain.yml --password 1111'.split(' '))
        .it('runs decrypt and creates file', async (ctx) => {
            expect(ctx.stdout).to.contain(
                'Decrypted file target/tests.encrypt/plain.yml has been created! Any private keys on this file are now in plain text. Remember to remove the file!',
            );
            expect(await BootstrapUtils.loadYaml('target/tests.encrypt/plain.yml', false)).deep.eq(
                await BootstrapUtils.loadYaml('test/encrypt/plain.yml', false),
            );
            expect(CryptoUtils.encryptedCount(await BootstrapUtils.loadYaml('target/tests.encrypt/plain.yml', false))).eq(0);
        });

    test.add('remove target', () => BootstrapUtils.deleteFolder('target/tests.encrypt'))
        .stdout()
        .command('decrypt --source test/encrypt/plain.yml --destination target/tests.encrypt/plain.yml --password 1111'.split(' '))
        .it('runs decrypt on plain and creates file', async (ctx) => {
            expect(ctx.stdout).to.contain(
                'Decrypted file target/tests.encrypt/plain.yml has been created! Any private keys on this file are now in plain text. Remember to remove the file!',
            );
            expect(await BootstrapUtils.loadYaml('target/tests.encrypt/plain.yml', false)).deep.eq(
                await BootstrapUtils.loadYaml('test/encrypt/plain.yml', false),
            );
            expect(CryptoUtils.encryptedCount(await BootstrapUtils.loadYaml('target/tests.encrypt/plain.yml', false))).eq(0);
        });

    test.add('remove target', () => BootstrapUtils.deleteFolder('target/tests.encrypt'))
        .stdout()
        .command('decrypt --source test/encrypt/plain.yml --destination target/tests.encrypt/plain.yml --password 1111'.split(' '))
        .it('runs decrypt on an plain file and creates file', async (ctx) => {
            expect(ctx.stdout).to.contain(
                'Decrypted file target/tests.encrypt/plain.yml has been created! Any private keys on this file are now in plain text. Remember to remove the file!',
            );
            expect(await BootstrapUtils.loadYaml('target/tests.encrypt/plain.yml', false)).deep.eq(
                await BootstrapUtils.loadYaml('test/encrypt/plain.yml', false),
            );
            expect(CryptoUtils.encryptedCount(await BootstrapUtils.loadYaml('target/tests.encrypt/plain.yml', false))).eq(0);
        });

    test.add('remove target', () => BootstrapUtils.deleteFolder('target/tests.encrypt'))
        .stdout()
        .command('decrypt --source test/encrypt/encrypted.yml --destination target/tests.encrypt/plain.yml --password 1'.split(' '))
        .catch((ctx) => {
            expect(ctx.message).to.contain('--password is invalid, Password must have at least 4 characters but got 1');
        })
        .it('password too short');

    test.add('remove target', () => BootstrapUtils.deleteFolder('target/tests.encrypt'))
        .stdout()
        .command('decrypt --source test/encrypt/encrypted.yml --destination target/tests.encrypt/plain.yml --password 222222'.split(' '))
        .catch((ctx) => {
            expect(ctx.message).to.contain('Cannot decrypt file test/encrypt/encrypted.yml. Have you used the right password?');
        })
        .it('invalid password');

    test.add('remove target', () => BootstrapUtils.deleteFolder('target/tests.encrypt'))
        .stdout()
        .command('decrypt --source test/encrypt/plain.yml --destination test/encrypt/plain.yml --password 1111'.split(' '))
        .catch((ctx) => {
            expect(ctx.message).to.contain('Destination file test/encrypt/plain.yml already exists!');
        })
        .it('same destination');
});
