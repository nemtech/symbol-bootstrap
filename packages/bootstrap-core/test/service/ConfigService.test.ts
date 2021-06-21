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
import { Assembly, ConfigService, CryptoUtils, Preset } from '../../src/service';

describe('ConfigService', () => {
    it('ConfigService bootstrap run with custom_preset.yml', async () => {
        await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            offline: true,
            preset: Preset.dualCurrency,
            target: 'target/tests/ConfigService.test.optin',
            customPreset: './test/custom_preset.yml',
        }).run();
    });

    it('ConfigService bootstrap in custom preset run with override-currency-preset.yml', async () => {
        await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            offline: true,
            target: 'target/tests/ConfigService.test.custom',
            customPreset: './test/override-currency-preset.yml',
        }).run();
    });

    it('ConfigService testnet assembly', async () => {
        await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            offline: true,
            target: 'target/tests/ConfigService.test.testnet',
            preset: Preset.testnet,
            assembly: 'dual',
        }).run();
    });

    it('ConfigService mainnet assembly', async () => {
        await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            offline: true,
            target: 'target/tests/ConfigService.test.mainnet',
            preset: Preset.mainnet,
            assembly: 'dual',
        }).run();
    });

    it('ConfigService bootstrap default', async () => {
        const configResult = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            offline: true,
            password: '1111',
            target: 'target/tests/bootstrap',
            preset: Preset.dualCurrency,
        }).run();

        expect(configResult.addresses.mosaics?.length).eq(2);
        expect(configResult.addresses.mosaics?.[0]?.accounts.length).eq(5);
        expect(configResult.addresses.mosaics?.[1]?.accounts.length).eq(2);

        const configResultUpgrade = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            upgrade: true,
            offline: true,
            password: '1111',
            target: 'target/tests/bootstrap',
            preset: Preset.dualCurrency,
        }).run();
        expect(configResult.addresses).deep.eq(configResultUpgrade.addresses);

        expect(CryptoUtils.removePrivateKeys(configResultUpgrade.presetData)).deep.eq(
            CryptoUtils.removePrivateKeys(configResult.presetData),
        );
    });

    it('ConfigService bootstrap repeat', async () => {
        const configResult = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            offline: true,
            target: 'target/tests/ConfigService.bootstrap.repeat',
            preset: Preset.dualCurrency,
            assembly: Assembly.multinode,
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
            offline: true,
            target: 'target/tests/ConfigService.mainnet.supernode',
            preset: Preset.mainnet,
            customPreset: 'test/unit-test-profiles/supernode.yml',
            assembly: 'dual',
        }).run();
        const configResultUpgrade = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            upgrade: true,
            offline: true,
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
            offline: true,
            customPreset: 'test/unit-test-profiles/supernode.yml',
            assembly: 'dual',
        }).run();
        const configResultUpgrade = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            upgrade: true,
            offline: true,
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
    it('singleCurrency custom distribution', async () => {
        const configResultInitial = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            target: 'target/tests/ConfigService.singleCurrency-custom-distribution',
            preset: Preset.singleCurrency,
            assembly: Assembly.multinode,
            offline: true,
            customPresetObject: {
                nemesis: {
                    nemesisSignerPrivateKey: '935C58E9D933D9A4E3BE6EEB5DA7B518FF90DA6B32BA6BEDE1098B79E2B69B66',
                    mosaics: [
                        {
                            accounts: 20,
                            currencyDistributions: [
                                {
                                    address: 'TACBGHDQEJOAOAIR4KGWWAOZRGGSR4BPR6JRCPI',
                                    amount: 1,
                                },
                                {
                                    address: 'TBJEKGLTINMGFEH6O47E7ZXMZFWZAJHBJTHOVUY',
                                    amount: 2,
                                },
                                {
                                    address: 'TAFVG5SVH3PVPK7A53P33GADIDHZBRYESR4BHOA',
                                    amount: 3,
                                },
                                {
                                    address: 'TB7CMTCZBRMWTGDFBU6D5Q6OSTFEIS47QI6NX6Q',
                                    amount: 4,
                                },
                                {
                                    address: 'TCDXRIOF2TNZDGMKZJNEVYY2OJVS7V5AKXXADFI',
                                    amount: 5,
                                },
                                {
                                    address: 'TCHX23ENEKTSUGI7MMXFFALNF57C6WXBL7VXM7I',
                                    amount: 6,
                                },
                                {
                                    address: 'TCCGI34RLMGW5HTEB3YLKK3BAYVV3XPEBCB6EBI',
                                    amount: 7,
                                },
                                {
                                    address: 'TBKXWLGKQSCLNSVHQWTI2V3C6SMJMGFBEZOQY5Y',
                                    amount: 8,
                                },
                            ],
                        },
                    ],
                },
            },
        }).run();
        expect(configResultInitial.presetData.nemesis?.mosaics?.length).to.be.eq(1);
        expect(configResultInitial.presetData.nemesis?.mosaics?.[0].currencyDistributions.length).to.be.eq(31);

        expect(configResultInitial.addresses.mosaics?.[0].id).eq('113DFC906359F64D');
        expect(configResultInitial.addresses.mosaics?.[0].name).eq('currency');

        const currencyMosaicBalances = configResultInitial.presetData.nemesis?.mosaics?.[0].currencyDistributions.map((m) => m.amount);
        expect(currencyMosaicBalances).to.be.deep.eq([
            1415043477913043, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259,
            391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259,
            391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 50000000000000,
            50000000000000, 50000000000000, 1, 2, 3, 4, 5, 6, 7, 8,
        ]);
    });
    it('Bootstrap custom distribution', async () => {
        const configResultInitial = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            target: 'target/tests/ConfigService.bootstrap-custom-distribution',
            preset: Preset.dualCurrency,
            offline: true,
            assembly: Assembly.multinode,
            customPreset: 'test/unit-test-profiles/bootstrap-custom-distribution.yml',
        }).run();
        expect(configResultInitial.presetData.nemesis?.mosaics?.length).to.be.eq(2);
        expect(configResultInitial.presetData.nemesis?.mosaics?.[0].currencyDistributions.length).to.be.eq(31);
        expect(configResultInitial.presetData.nemesis?.mosaics?.[1].currencyDistributions.length).to.be.eq(18);

        expect(configResultInitial.addresses.mosaics?.[0].id).eq('113DFC906359F64D');
        expect(configResultInitial.addresses.mosaics?.[0].name).eq('currency');

        expect(configResultInitial.addresses.mosaics?.[1].id).eq('0B2720BC49498DAC');
        expect(configResultInitial.addresses.mosaics?.[1].name).eq('harvest');

        const currencyMosaicBalances = configResultInitial.presetData.nemesis?.mosaics?.[0].currencyDistributions.map((m) => m.amount);
        expect(currencyMosaicBalances).to.be.deep.eq([
            391260869478266, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259,
            391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259,
            391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259, 391260869478259,
            391260869478259, 391260869478259, 1, 2, 3, 4, 5, 6, 7, 8,
        ]);
        const harvestMosaicBalances = configResultInitial.presetData.nemesis?.mosaics?.[1].currencyDistributions.map((m) => m.amount);
        expect(harvestMosaicBalances).to.be.deep.eq([
            1153845, 1153845, 1153845, 1153845, 1153845, 1153845, 1153845, 1153845, 1153845, 1153845, 1153845, 1153845, 1153845, 1, 2, 3, 4,
            5,
        ]);
    });
    it('Bootstrap custom distribution with custom maxHarvesterBalance', async () => {
        const configResultInitial = await new ConfigService('.', {
            ...ConfigService.defaultParams,
            reset: true,
            offline: true,
            target: 'target/tests/ConfigService.bootstrap-custom-distribution-with-balances',
            preset: Preset.dualCurrency,
            assembly: Assembly.multinode,
            customPresetObject: {
                maxHarvesterBalance: 13000,
                nemesis: {
                    nemesisSignerPrivateKey: '935C58E9D933D9A4E3BE6EEB5DA7B518FF90DA6B32BA6BEDE1098B79E2B69B66',
                    mosaics: [
                        {
                            accounts: 3,
                            currencyDistributions: [
                                {
                                    address: 'TACBGHDQEJOAOAIR4KGWWAOZRGGSR4BPR6JRCPI',
                                    amount: 1,
                                },
                                {
                                    address: 'TBJEKGLTINMGFEH6O47E7ZXMZFWZAJHBJTHOVUY',
                                    amount: 2,
                                },
                            ],
                        },
                        {
                            accounts: 2,
                            currencyDistributions: [
                                {
                                    address: 'TACBGHDQEJOAOAIR4KGWWAOZRGGSR4BPR6JRCPI',
                                    amount: 1,
                                },
                            ],
                        },
                    ],
                },
            },
        }).run();
        expect(configResultInitial.presetData.nemesis?.mosaics?.length).to.be.eq(2);
        expect(configResultInitial.presetData.nemesis?.mosaics?.[0].currencyDistributions.length).to.be.eq(8);
        expect(configResultInitial.presetData.nemesis?.mosaics?.[1].currencyDistributions.length).to.be.eq(6);

        expect(configResultInitial.addresses.mosaics?.[0].id).eq('113DFC906359F64D');
        expect(configResultInitial.addresses.mosaics?.[0].name).eq('currency');

        expect(configResultInitial.addresses.mosaics?.[1].id).eq('0B2720BC49498DAC');
        expect(configResultInitial.addresses.mosaics?.[1].name).eq('harvest');

        const currencyMosaicBalances = configResultInitial.presetData.nemesis?.mosaics?.[0].currencyDistributions.map((m) => m.amount);
        expect(currencyMosaicBalances).to.be.deep.eq([
            1499833333000002, 1499833332999999, 1499833332999999, 1499833332999999, 1499833332999999, 1499833332999999, 1, 2,
        ]);
        const harvestMosaicBalances = configResultInitial.presetData.nemesis?.mosaics?.[1].currencyDistributions.map((m) => m.amount);
        expect(harvestMosaicBalances).to.be.deep.eq([11961000, 2999999, 13000, 13000, 13000, 1]);
    });
});
