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
import { Account, NetworkType } from 'symbol-sdk';
import { ConfigAccount, PrivateKeySecurityMode } from '../../src/model';
import { BootstrapUtils, ConfigLoader, KeyName, Preset } from '../../src/service';

class ConfigLoaderMocked extends ConfigLoader {
    public generateAccount = (
        networkType: NetworkType,
        securityMode: PrivateKeySecurityMode,
        keyName: KeyName,
        oldAccount: ConfigAccount | undefined,
        privateKey: string | undefined,
        publicKey: string | undefined,
    ): ConfigAccount => super.generateAccount(networkType, securityMode, keyName, oldAccount, privateKey || 'a'.repeat(64), publicKey);
}

describe('ConfigLoader', () => {
    it('ConfigLoader loadPresetData testnet no assembly', async () => {
        const configLoader = new ConfigLoaderMocked();
        try {
            await configLoader.createPresetData({
                root: '.',
                preset: Preset.testnet,
                assembly: undefined,
                customPreset: undefined,
                customPresetObject: undefined,
                password: 'abc',
            });
        } catch (e) {
            expect(e.message).to.equal('Preset testnet requires assembly (-a, --assembly option). Possible values are: api, dual, peer');
            return;
        }
        expect(true).to.be.false;
    });

    it('ConfigLoader loadPresetData testnet assembly', async () => {
        const configLoader = new ConfigLoaderMocked();
        const presetData = await configLoader.createPresetData({
            root: '.',
            preset: Preset.testnet,
            assembly: 'dual',
            customPreset: undefined,
            customPresetObject: undefined,
            password: 'abc',
        });
        expect(presetData).to.not.be.undefined;
    });

    it('ConfigLoader supernode custom maxUnlockedAccounts', async () => {
        const configLoader = new ConfigLoaderMocked();
        const originalPresetData = await configLoader.createPresetData({
            root: '.',
            preset: Preset.testnet,
            assembly: 'dual',
            customPreset: 'test/unit-test-profiles/supernode.yml',
            customPresetObject: {
                maxUnlockedAccounts: 30,
            },
            password: 'abcd',
        });
        expect(originalPresetData).to.not.be.undefined;
        expect(originalPresetData.nodes![0].maxUnlockedAccounts).eq(undefined);
        expect(originalPresetData.maxUnlockedAccounts).eq(30);
        expect(originalPresetData.customPresetCache).deep.eq({
            maxUnlockedAccounts: 30,
            nodes: [
                {
                    agentPrivateKey: 'AAAA231C860EB1B6E3A4F8366C8F0F6C7C2462A40263DCB67124FB76CDD4E368',
                    agentUrl: 'https://fboucquez-agent-symbollocal.ngrok.io',
                    host: 'fboucquez-agent-symbollocal.ngrok.io',
                    mainPrivateKey: 'CA82E7ADAF7AB729A5462A1BD5AA78632390634904A64EB1BB22295E2E1A1BDD',
                    remotePrivateKey: 'EFE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1',
                    restGatewayUrl: 'http://fboucquez-rest-gateway-symbollocal.ngrok.io',
                    rewardProgram: 'supernode',
                    transportPrivateKey: '6154154096354BC3DB522174ACD8BFE553893A0991BD5D105599846F17A3383B',
                    voting: true,
                    vrfPrivateKey: 'F3C24C153783B683E40FB2671493B54480370BF4E3AB8027D4BF1293E14EB9B8',
                },
            ],
            privateKeySecurityMode: 'PROMPT_MAIN',
        });

        const upgradedPresetData = await configLoader.createPresetData({
            oldPresetData: originalPresetData,
            root: '.',
            preset: Preset.testnet,
            assembly: 'dual',
            password: 'abcd',
        });
        expect(upgradedPresetData).to.not.be.undefined;
        expect(upgradedPresetData.nodes![0].maxUnlockedAccounts).eq(undefined);
        expect(upgradedPresetData.maxUnlockedAccounts).eq(30);
        expect(upgradedPresetData.customPresetCache).deep.eq({
            maxUnlockedAccounts: 30,
            nodes: [
                {
                    agentPrivateKey: 'AAAA231C860EB1B6E3A4F8366C8F0F6C7C2462A40263DCB67124FB76CDD4E368',
                    agentUrl: 'https://fboucquez-agent-symbollocal.ngrok.io',
                    host: 'fboucquez-agent-symbollocal.ngrok.io',
                    mainPrivateKey: 'CA82E7ADAF7AB729A5462A1BD5AA78632390634904A64EB1BB22295E2E1A1BDD',
                    remotePrivateKey: 'EFE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1',
                    restGatewayUrl: 'http://fboucquez-rest-gateway-symbollocal.ngrok.io',
                    rewardProgram: 'supernode',
                    transportPrivateKey: '6154154096354BC3DB522174ACD8BFE553893A0991BD5D105599846F17A3383B',
                    voting: true,
                    vrfPrivateKey: 'F3C24C153783B683E40FB2671493B54480370BF4E3AB8027D4BF1293E14EB9B8',
                },
            ],
            privateKeySecurityMode: 'PROMPT_MAIN',
        });

        const upgradedPresetResetToDefaults = await configLoader.createPresetData({
            oldPresetData: originalPresetData,
            root: '.',
            preset: Preset.testnet,
            customPresetObject: {
                maxUnlockedAccounts: 15,
            },
            assembly: 'dual',
            password: 'abcd',
        });
        expect(upgradedPresetResetToDefaults).to.not.be.undefined;
        expect(upgradedPresetResetToDefaults.nodes![0].maxUnlockedAccounts).eq(undefined);
        expect(upgradedPresetResetToDefaults.maxUnlockedAccounts).eq(15);
        expect(upgradedPresetResetToDefaults.customPresetCache).deep.eq({
            maxUnlockedAccounts: 15,
        });
    });

    it('mergePreset', async () => {
        const configLoader = new ConfigLoaderMocked();
        expect(
            configLoader.mergePresets(
                { maxUnlockedAccounts: 1, inflation: { a: 1, c: 1, d: 1 } },
                { maxUnlockedAccounts: 2 },
                { maxUnlockedAccounts: 3, inflation: { c: 2, d: 2, e: 2 } },
                { maxUnlockedAccounts: 4 },
            ),
        ).deep.eq({ maxUnlockedAccounts: 4, inflation: { c: 2, d: 2, e: 2 } });
    });

    it('mergePreset with node', async () => {
        const configLoader = new ConfigLoaderMocked();
        const merged = configLoader.mergePresets(
            {
                maxUnlockedAccounts: 1,
                inflation: { a: 1, c: 1, d: 1 },
            },
            { nodes: [{ maxUnlockedAccounts: 5, name: 'name1' }], knownRestGateways: ['r1', 'r2'] },
            { maxUnlockedAccounts: 3, inflation: { c: 2, d: 2, e: 2 }, knownRestGateways: ['r2', 'r3'] },
            {
                maxUnlockedAccounts: 4,
                nodes: [{ maxUnlockedAccounts: 3 }, { maxUnlockedAccounts: 4, name: 'nameB' }],
            },
        );
        console.log(JSON.stringify(merged));
        expect(merged).deep.eq({
            maxUnlockedAccounts: 4,
            inflation: { c: 2, d: 2, e: 2 },
            nodes: [
                { maxUnlockedAccounts: 3, name: 'name1' },
                { maxUnlockedAccounts: 4, name: 'nameB' },
            ],
            knownRestGateways: ['r2', 'r3'],
        });
    });

    it('ConfigLoader loadPresetData bootstrap custom', async () => {
        const configLoader = new ConfigLoaderMocked();
        const presetData = await configLoader.createPresetData({
            root: '.',
            preset: Preset.bootstrap,
            assembly: undefined,
            customPreset: 'test/override-currency-preset.yml',
            customPresetObject: undefined,
            password: 'abcd',
        });
        expect(presetData).to.not.be.undefined;
        expect(presetData?.nemesis?.mosaics?.[0].accounts).to.be.eq(20);
        const yaml = BootstrapUtils.toYaml(presetData);
        expect(BootstrapUtils.fromYaml(yaml)).to.be.deep.eq(presetData);
    });

    it('ConfigLoader loadPresetData bootstrap custom too short!', async () => {
        const configLoader = new ConfigLoaderMocked();
        try {
            await configLoader.createPresetData({
                root: '.',
                preset: Preset.bootstrap,
                assembly: undefined,
                customPreset: 'test/override-currency-preset.yml',
                customPresetObject: undefined,
                password: 'abc',
            });
        } catch (e) {
            expect(e.message).eq('Password is too short. It should have at least 4 characters!');
        }
    });

    it('applyIndex', async () => {
        const configLoader = new ConfigLoaderMocked();
        const context = { $index: 10 };
        expect(configLoader.applyValueTemplate(context, 'hello')).to.be.eq('hello');
        expect(configLoader.applyValueTemplate(context, 'index')).to.be.eq('index');
        expect(configLoader.applyValueTemplate(context, '$index')).to.be.eq('$index');
        expect(configLoader.applyValueTemplate(context, '{{index}}')).to.be.eq('');
        expect(configLoader.applyValueTemplate(context, '{{$index}}')).to.be.eq('10');
        expect(configLoader.applyValueTemplate(context, '{{add $index 2}}')).to.be.eq('12');
        expect(configLoader.applyValueTemplate(context, '100.100.{{add $index 2}}')).to.be.eq('100.100.12');
        expect(configLoader.applyValueTemplate(context, '100.100.{{add $index 5}}')).to.be.eq('100.100.15');
    });

    it('expandServicesRepeat when repeat 3', async () => {
        const configLoader = new ConfigLoaderMocked();
        const services = [
            {
                repeat: 3,
                apiNodeName: 'api-node-{{$index}}',
                apiNodeHost: 'api-node-{{$index}}',
                apiNodeBrokerHost: 'api-node-broker-{{$index}}',
                name: 'rest-gateway-{{$index}}',
                description: 'catapult development network',
                databaseHost: 'db-{{$index}}',
                openPort: true,
                ipv4_address: '172.20.0.{{add $index 5}}',
            },
        ];

        const expandedServices = configLoader.expandServicesRepeat({}, services);

        const expectedExpandedServices = [
            {
                apiNodeName: 'api-node-0',
                apiNodeHost: 'api-node-0',
                apiNodeBrokerHost: 'api-node-broker-0',
                name: 'rest-gateway-0',
                description: 'catapult development network',
                databaseHost: 'db-0',
                openPort: true,
                ipv4_address: '172.20.0.5',
            },
            {
                apiNodeName: 'api-node-1',
                apiNodeHost: 'api-node-1',
                apiNodeBrokerHost: 'api-node-broker-1',
                name: 'rest-gateway-1',
                description: 'catapult development network',
                databaseHost: 'db-1',
                openPort: true,
                ipv4_address: '172.20.0.6',
            },
            {
                apiNodeName: 'api-node-2',
                apiNodeHost: 'api-node-2',
                apiNodeBrokerHost: 'api-node-broker-2',
                name: 'rest-gateway-2',
                description: 'catapult development network',
                databaseHost: 'db-2',
                openPort: true,
                ipv4_address: '172.20.0.7',
            },
        ];
        expect(expandedServices).to.be.deep.eq(expectedExpandedServices);
    });

    it('expandServicesRepeat when repeat 0', async () => {
        const configLoader = new ConfigLoaderMocked();
        const services = [
            {
                repeat: 0,
                apiNodeName: 'api-node-{{$index}}',
                apiNodeHost: 'api-node-{{$index}}',
                apiNodeBrokerHost: 'api-node-broker-{{$index}}',
                name: 'rest-gateway-{{$index}}',
                description: 'catapult development network',
                databaseHost: 'db-{{$index}}',
                openPort: true,
                ipv4_address: '172.20.0.{{add $index 5}}',
            },
        ];

        const expandedServices = configLoader.expandServicesRepeat({}, services);

        expect(expandedServices).to.be.deep.eq([]);
    });

    it('expandServicesRepeat when no repeat', async () => {
        const configLoader = new ConfigLoaderMocked();
        const services = [
            {
                apiNodeName: 'api-node-{{$index}}',
                apiNodeHost: 'api-node-{{$index}}',
                apiNodeBrokerHost: 'api-node-broker-{{$index}}',
                name: 'rest-gateway-{{$index}}',
                description: 'catapult development network',
                databaseHost: 'db-{{$index}}',
                openPort: true,
                ipv4_address: '172.20.0.{{add $index 5}}',
            },
        ];

        const expandedServices = configLoader.expandServicesRepeat({}, services);

        const expectedExpandedServices = [
            {
                apiNodeBrokerHost: 'api-node-broker-0',
                apiNodeHost: 'api-node-0',
                apiNodeName: 'api-node-0',
                databaseHost: 'db-0',
                description: 'catapult development network',
                ipv4_address: '172.20.0.5',
                name: 'rest-gateway-0',
                openPort: true,
            },
        ];
        expect(expandedServices).to.be.deep.eq(expectedExpandedServices);
    });

    it('applyValueTemplate when object', async () => {
        const configLoader = new ConfigLoaderMocked();
        const value = {
            _info: 'this file contains a list of api-node peers',
            knownPeers: [
                {
                    publicKey: '46902d4a6136d43f8d78e3ab4494aee9b1da17886f6f0a698959714f96900bd6',
                    endpoint: {
                        host: 'api-node-0',
                        port: 7900,
                    },
                    metadata: {
                        name: 'api-node-0',
                        roles: 'Api',
                    },
                },
            ],
        };

        expect(configLoader.applyValueTemplate({}, value)).to.be.deep.eq(value);
        expect(configLoader.applyValueTemplate({}, BootstrapUtils.fromYaml(BootstrapUtils.toYaml(value)))).to.be.deep.eq(value);
    });

    it('applyValueTemplate when array', async () => {
        const configLoader = new ConfigLoaderMocked();
        const value = [
            {
                _info: 'this file contains a list of api-node peers',
                knownPeers: [
                    {
                        publicKey: '46902d4a6136d43f8d78e3ab4494aee9b1da17886f6f0a698959714f96900bd6',
                        endpoint: {
                            host: 'api-node-0',
                            port: 7900,
                        },
                        metadata: {
                            name: 'api-node-0',
                            roles: 'Api',
                        },
                    },
                ],
            },
        ];

        expect(configLoader.applyValueTemplate({}, value)).to.be.deep.eq(value);
        expect(configLoader.applyValueTemplate({}, BootstrapUtils.fromYaml(BootstrapUtils.toYaml(value)))).to.be.deep.eq(value);
    });

    it('should migrated old addresses', () => {
        const configLoader = new ConfigLoaderMocked();
        const oldAddresses = BootstrapUtils.loadYaml('./test/addresses/addresses-old.yml', false);
        const newAddresses = BootstrapUtils.loadYaml('./test/addresses/addresses-new.yml', false);
        const addresses = configLoader.migrateAddresses(oldAddresses, NetworkType.TEST_NET);
        expect(addresses).to.be.deep.eq(newAddresses);
    });

    it('should migrated not migrate new addresses', () => {
        const configLoader = new ConfigLoaderMocked();
        const newAddresses = BootstrapUtils.loadYaml('./test/addresses/addresses-new.yml', false);
        const addresses = configLoader.migrateAddresses(newAddresses, NetworkType.TEST_NET);
        expect(addresses).to.be.deep.eq(newAddresses);
    });

    it('should generateAccount when old and new are different', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.ENCRYPT;
        const oldAccount = Account.generateNewAccount(networkType);
        const newAccount = Account.generateNewAccount(networkType);
        const account = configLoader.generateAccount(
            networkType,
            securityMode,
            KeyName.Main,
            {
                publicKey: oldAccount.publicKey,
                address: oldAccount.address.plain(),
                privateKey: oldAccount.privateKey,
            },
            newAccount.privateKey,
            newAccount.publicKey,
        );
        expect(account).deep.eq({
            publicKey: newAccount.publicKey,
            address: newAccount.address.plain(),
            privateKey: newAccount.privateKey,
        });
    });

    it('should generateAccount when old and new are different', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.ENCRYPT;
        const oldAccount = Account.generateNewAccount(networkType);
        const newAccount = Account.generateNewAccount(networkType);
        const account = configLoader.generateAccount(
            networkType,
            securityMode,
            KeyName.Main,
            {
                publicKey: oldAccount.publicKey,
                address: oldAccount.address.plain(),
                privateKey: oldAccount.privateKey,
            },
            newAccount.privateKey,
            newAccount.publicKey,
        );
        expect(account).deep.eq({
            publicKey: newAccount.publicKey,
            address: newAccount.address.plain(),
            privateKey: newAccount.privateKey,
        });
    });

    it('should generateAccount when old and new are same', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.ENCRYPT;
        const oldAccount = Account.generateNewAccount(networkType);
        const newAccount = oldAccount;
        const account = configLoader.generateAccount(
            networkType,
            securityMode,
            KeyName.Main,
            {
                publicKey: oldAccount.publicKey,
                address: oldAccount.address.plain(),
                privateKey: oldAccount.privateKey,
            },
            newAccount.privateKey,
            newAccount.publicKey,
        );
        expect(account).deep.eq({
            publicKey: newAccount.publicKey,
            address: newAccount.address.plain(),
            privateKey: newAccount.privateKey,
        });
    });

    it('should generateAccount when old and new are same, new no private eky', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.ENCRYPT;
        const oldAccount = Account.generateNewAccount(networkType);
        const newAccount = oldAccount;
        const account = configLoader.generateAccount(
            networkType,
            securityMode,
            KeyName.Main,
            {
                publicKey: oldAccount.publicKey,
                address: oldAccount.address.plain(),
                privateKey: oldAccount.privateKey,
            },
            undefined,
            newAccount.publicKey,
        );
        expect(account).deep.eq({
            publicKey: newAccount.publicKey,
            address: newAccount.address.plain(),
            privateKey: newAccount.privateKey,
        });
    });

    it('should generateAccount when old and new are same, old no private eky', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.ENCRYPT;
        const oldAccount = Account.generateNewAccount(networkType);
        const newAccount = oldAccount;
        const account = configLoader.generateAccount(
            networkType,
            securityMode,
            KeyName.Main,
            {
                publicKey: oldAccount.publicKey,
                address: oldAccount.address.plain(),
            },
            newAccount.privateKey,
            newAccount.publicKey,
        );
        expect(account).deep.eq({
            publicKey: newAccount.publicKey,
            address: newAccount.address.plain(),
            privateKey: newAccount.privateKey,
        });
    });

    it('should generateAccount when old and new are same, old private key', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.ENCRYPT;
        const oldAccount = Account.generateNewAccount(networkType);
        const newAccount = oldAccount;
        const account = configLoader.generateAccount(
            networkType,
            securityMode,
            KeyName.Main,
            {
                publicKey: oldAccount.publicKey,
                address: oldAccount.address.plain(),
            },
            undefined,
            newAccount.publicKey,
        );
        expect(account).deep.eq({
            publicKey: newAccount.publicKey,
            address: newAccount.address.plain(),
        });
    });

    it('should generateAccount when old and new are different, no private key new', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.ENCRYPT;
        const oldAccount = Account.generateNewAccount(networkType);
        const newAccount = Account.generateNewAccount(networkType);
        const account = configLoader.generateAccount(
            networkType,
            securityMode,
            KeyName.Main,
            {
                publicKey: oldAccount.publicKey,
                address: oldAccount.address.plain(),
                privateKey: oldAccount.privateKey,
            },
            undefined,
            newAccount.publicKey,
        );
        expect(account).deep.eq({
            publicKey: newAccount.publicKey,
            address: newAccount.address.plain(),
        });
    });

    it('should generateAccount when old and new are different. No new account', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.ENCRYPT;
        const oldAccount = Account.generateNewAccount(networkType);
        const account = configLoader.generateAccount(
            networkType,
            securityMode,
            KeyName.Main,
            {
                publicKey: oldAccount.publicKey,
                address: oldAccount.address.plain(),
                privateKey: oldAccount.privateKey,
            },
            undefined,
            undefined,
        );
        expect(account).deep.eq({
            publicKey: oldAccount.publicKey,
            address: oldAccount.address.plain(),
            privateKey: oldAccount.privateKey,
        });
    });

    it('should generateAccount when old and new are different. No new account. Old without private', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.ENCRYPT;
        const oldAccount = Account.generateNewAccount(networkType);
        const account = configLoader.generateAccount(
            networkType,
            securityMode,
            KeyName.Main,
            {
                publicKey: oldAccount.publicKey,
                address: oldAccount.address.plain(),
            },
            undefined,
            undefined,
        );
        expect(account).deep.eq({
            publicKey: oldAccount.publicKey,
            address: oldAccount.address.plain(),
        });
    });

    it('should generateAccount brand new', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.ENCRYPT;
        const account = configLoader.generateAccount(networkType, securityMode, KeyName.Main, undefined, undefined, undefined);
        expect(account.address).not.undefined;
        expect(account.privateKey).not.undefined;
        expect(account.privateKey).not.undefined;
    });

    it('should generateAccount brand new on remote', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.PROMPT_MAIN_TRANSPORT;
        const account = configLoader.generateAccount(networkType, securityMode, KeyName.Remote, undefined, undefined, undefined);
        expect(account.address).not.undefined;
        expect(account.privateKey).not.undefined;
        expect(account.privateKey).not.undefined;
    });

    it('should generateAccount brand new on voting', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.PROMPT_MAIN;
        const account = configLoader.generateAccount(networkType, securityMode, KeyName.Voting, undefined, undefined, undefined);
        expect(account.address).not.undefined;
        expect(account.privateKey).not.undefined;
        expect(account.privateKey).not.undefined;
    });

    it('should generateAccount raise error new', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.PROMPT_MAIN;
        expect(() => configLoader.generateAccount(networkType, securityMode, KeyName.Main, undefined, undefined, undefined)).throw;
    });

    it('should generateAccount raise error new', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.PROMPT_MAIN_TRANSPORT;
        expect(() => configLoader.generateAccount(networkType, securityMode, KeyName.Transport, undefined, undefined, undefined)).throw;
    });

    it('should generateAccount raise error new', () => {
        const configLoader = new ConfigLoader();
        const networkType = NetworkType.MIJIN_TEST;
        const securityMode = PrivateKeySecurityMode.PROMPT_ALL;
        expect(() => configLoader.generateAccount(networkType, securityMode, KeyName.Remote, undefined, undefined, undefined)).throw;
    });
});
