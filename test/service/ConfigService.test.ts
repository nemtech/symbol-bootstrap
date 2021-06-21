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

import { expect } from '@oclif/test';
import 'mocha';
import { ConfigService, CryptoUtils, Preset } from '../../src/service';

describe('ConfigService', () => {
    it('ConfigService bootstrap run with optin_preset.yml', async () => {
        await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            preset: Preset.bootstrap,
            target: 'target/tests/ConfigService.test.optin',
            customPreset: './test/optin_preset.yml',
        }).run();
    });

    it('ConfigService bootstrap in custom preset run with override-currency-preset.yml', async () => {
        await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            target: 'target/tests/ConfigService.test.custom',
            customPreset: './test/override-currency-preset.yml',
        }).run();
    });

    it('ConfigService testnet assembly', async () => {
        await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            target: 'target/tests/ConfigService.test.testnet',
            preset: Preset.testnet,
            assembly: 'dual',
        }).run();
    });

    it('ConfigService mainnet assembly', async () => {
        await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            target: 'target/tests/ConfigService.test.mainnet',
            preset: Preset.mainnet,
            assembly: 'dual',
        }).run();
    });

    it('ConfigService bootstrap default', async () => {
        const configResult = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            target: 'target/tests/bootstrap',
            preset: Preset.bootstrap,
        }).run();

        const configResultUpgrade = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            upgrade: true,
            target: 'target/tests/bootstrap',
            preset: Preset.bootstrap,
        }).run();

        expect(CryptoUtils.removePrivateKeys(configResultUpgrade.presetData)).deep.eq(
            CryptoUtils.removePrivateKeys(configResult.presetData),
        );
    });

    it('ConfigService bootstrap repeat', async () => {
        const configResult = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            target: 'target/tests/ConfigService.bootstrap.repeat',
            preset: Preset.bootstrap,
            customPreset: './test/repeat_preset.yml',
        }).run();

        const assertRepeatedService = (expectedCount: number, services: any[] | undefined) => {
            expect(services!.length).to.be.eq(expectedCount);

            services?.forEach((service) => {
                Object.values(service).forEach((value) => {
                    expect((value + '').indexOf('index'), `'${value}' contains index!`).to.be.eq(-1);
                });
            });
        };

        assertRepeatedService(4, configResult.presetData.databases);
        assertRepeatedService(7, configResult.presetData.nodes);
        assertRepeatedService(4, configResult.presetData.gateways);
        assertRepeatedService(4, configResult.presetData.databases);
    });

    it('ConfigService mainnet supernode assembly after upgrade', async () => {
        const configResultInitial = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            target: 'target/tests/ConfigService.mainnet.supernode',
            preset: Preset.mainnet,
            customPreset: 'test/unit-test-profiles/supernode.yml',
            assembly: 'dual',
        }).run();
        const configResultUpgrade = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            upgrade: true,
            target: 'target/tests/ConfigService.mainnet.supernode',
            preset: Preset.mainnet,
            assembly: 'dual',
        }).run();
        expect(CryptoUtils.removePrivateKeys(configResultUpgrade.presetData)).deep.eq(
            CryptoUtils.removePrivateKeys(configResultInitial.presetData),
        );
        const configResultUpgradeSecond = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            upgrade: true,
            target: 'target/tests/ConfigService.mainnet.supernode',
        }).run();

        expect(CryptoUtils.removePrivateKeys(configResultUpgradeSecond.presetData)).deep.eq(
            CryptoUtils.removePrivateKeys(configResultInitial.presetData),
        );
    });

    it('ConfigService testnet supernode assembly after upgrade', async () => {
        const configResultInitial = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            target: 'target/tests/ConfigService.testnet.supernode',
            preset: Preset.testnet,
            customPreset: 'test/unit-test-profiles/supernode.yml',
            assembly: 'dual',
        }).run();
        const configResultUpgrade = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            upgrade: true,
            target: 'target/tests/ConfigService.testnet.supernode',
            preset: Preset.testnet,
            assembly: 'dual',
        }).run();
        expect(CryptoUtils.removePrivateKeys(configResultUpgrade.presetData)).deep.eq(
            CryptoUtils.removePrivateKeys(configResultInitial.presetData),
        );
        const configResultUpgradeSecond = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            upgrade: true,
            target: 'target/tests/ConfigService.testnet.supernode',
        }).run();

        expect(CryptoUtils.removePrivateKeys(configResultUpgradeSecond.presetData)).deep.eq(
            CryptoUtils.removePrivateKeys(configResultInitial.presetData),
        );
    });
});
