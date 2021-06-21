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
import { compareSync, Result } from 'dir-compare';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import 'mocha';
import { join } from 'path';
import { Account, Address, Convert, KeyPair, NetworkType } from 'symbol-sdk';
import { CustomPreset } from '../../src/model';
import {
    Assembly,
    BootstrapService,
    BootstrapUtils,
    ConfigLoader,
    ConfigParams,
    ConfigResult,
    DefaultPrivateKeyResolver,
    Preset,
    RewardProgram,
    VotingKeyFile,
    VotingKeyFileProvider,
    VotingKeyParams,
    VotingUtils,
} from '../../src/service';

const toKey = (prefix: string, keySize = 64): string => {
    return prefix.padStart(keySize, '0');
};

const toPublicKey = (prefix: string, keySize = 64): string => {
    return Convert.uint8ToHex(KeyPair.createKeyPairFromPrivateKeyString(prefix.padStart(keySize, '0')).publicKey);
};
/**
 * Not random voting key provider.
 */
export class UnitTestVotingKeyFileProvider implements VotingKeyFileProvider {
    public async createVotingFile({
        presetData,
        nodePreset,
        votingKeysFolder,
        privateKeyTreeFileName,
        votingKeyStartEpoch,
        votingKeyEndEpoch,
    }: VotingKeyParams): Promise<VotingKeyFile> {
        const privateKeySuffix = Convert.utf8ToHex(nodePreset.name);
        const secret = toKey(privateKeySuffix);
        const votingAccount = Account.createFromPrivateKey(secret, presetData.networkType);
        const votingPrivateKey = votingAccount.privateKey;
        const votingUtils = new VotingUtils();
        const unitTestPrivateKeys: Uint8Array[] = [];
        for (let i = votingKeyStartEpoch; i < votingKeyEndEpoch + 1; i++) {
            unitTestPrivateKeys.push(Convert.hexToUint8(toKey(i + privateKeySuffix)));
        }
        const votingFile = await votingUtils.createVotingFile(
            votingPrivateKey,
            votingKeyStartEpoch,
            votingKeyEndEpoch,
            unitTestPrivateKeys,
        );
        writeFileSync(join(votingKeysFolder, privateKeyTreeFileName), votingFile);
        return {
            publicKey: votingAccount.publicKey,
            startEpoch: votingKeyStartEpoch,
            endEpoch: votingKeyEndEpoch,
            filename: privateKeyTreeFileName,
        };
    }
}

const customPreset: CustomPreset = {
    privateKeySecurityMode: 'PROMPT_MAIN',
    maxUnlockedAccounts: 20,
    peersP2PListLimit: 10000,
    peersApiListLimit: 10000,
    restDeploymentToolVersion: '1.0.8',
    restDeploymentToolLastUpdatedDate: '2021-07-05',
    nodes: [
        {
            mainPrivateKey: '{{$index}}' + toKey('AAAAA1', 63),
            transportPrivateKey: '{{$index}}' + toKey('AAAAA2', 63),
            remotePrivateKey: '{{$index}}' + toKey('AAAAA3', 63),
            vrfPrivateKey: '{{$index}}' + toKey('AAAAA4', 63),
            agentPrivateKey: '{{$index}}' + toKey('AAAAA5', 63),
        },
    ],
};

const multinodeCustomPreset: CustomPreset = {
    nodes: [
        {
            mainPrivateKey: '{{$index}}' + toKey('AAAAA1', 63),
            transportPrivateKey: '{{$index}}' + toKey('AAAAA2', 63),
            remotePrivateKey: '{{$index}}' + toKey('AAAAA3', 63),
            vrfPrivateKey: '{{$index}}' + toKey('AAAAA4', 63),
            agentPrivateKey: '{{$index}}' + toKey('AAAAA5', 63),
        },
        {
            mainPrivateKey: '{{$index}}' + toKey('BBBBB1', 63),
            transportPrivateKey: '{{$index}}' + toKey('BBBBB2', 63),
            remotePrivateKey: '{{$index}}' + toKey('BBBBB3', 63),
            vrfPrivateKey: '{{$index}}' + toKey('BBBBB4', 63),
            agentPrivateKey: '{{$index}}' + toKey('BBBBB5', 63),
        },
    ],
};

const newNetworkType = NetworkType.PRIVATE_TEST;
const bootstrapCustomPreset: CustomPreset = {
    networkType: newNetworkType,
    nemesis: {
        nemesisSignerPrivateKey: toKey('AAAA'),
        mosaics: [
            {
                accounts: [toPublicKey('A1'), toPublicKey('A2'), toPublicKey('A3')],
            },
            {
                accounts: [toPublicKey('B1'), toPublicKey('B2'), toPublicKey('B3')],
            },
        ],
    },
    sinkAddress: Address.createFromPublicKey(toKey('BBB'), newNetworkType).plain(),
    nemesisGenerationHashSeed: toKey('CCC'),
};

const singleCurrencyCustomPreset: CustomPreset = {
    networkType: newNetworkType,
    nemesis: {
        nemesisSignerPrivateKey: toKey('AAAA'),
        mosaics: [
            {
                accounts: [toPublicKey('A1'), toPublicKey('A2'), toPublicKey('A3')],
            },
        ],
    },
    sinkAddress: Address.createFromPublicKey(toKey('BBB'), newNetworkType).plain(),
    nemesisGenerationHashSeed: toKey('CCC'),
};

describe('BootstrapService config', () => {
    const presets = Object.values(Preset);
    const assemblies = Object.values(Assembly);

    async function basicConfigTest(preset: string, assembly: string, constPresetObject: CustomPreset, targetFolderName: string) {
        const service = new BootstrapService();
        const target = `target/tests/${targetFolderName}`;
        const expectedTarget = `test/expectedTargets/${targetFolderName}`;
        const config: ConfigParams = {
            preset: preset,
            assembly: assembly,
            report: true,
            reset: true,
            offline: true,
            upgrade: false,
            target: target,
            version: '1.0.8',
            customPresetObject: constPresetObject,
            votingKeyFileProvider: new UnitTestVotingKeyFileProvider(),
            privateKeyResolver: new DefaultPrivateKeyResolver(),
            user: BootstrapUtils.CURRENT_USER,
        };

        async function runConfig(description: string, configRunner: () => Promise<ConfigResult>) {
            const patch = false;
            console.log();
            console.log(`Running '${description}'`);
            console.log();
            const configResult = await configRunner();
            const dockerCompose = await service.compose({ ...config, upgrade: true, user: '1000:1000' });
            expect(configResult.presetData).to.not.null;
            expect(dockerCompose).to.not.undefined;
            if (!existsSync(expectedTarget)) {
                await BootstrapUtils.generateConfiguration({}, target, expectedTarget);
            }
            const compareResult: Result = compareSync(target, expectedTarget, {
                compareSize: true,
                compareContent: true,
                skipEmptyDirs: true,
                excludeFilter: '*.pem',
            });
            const differences = compareResult.diffSet?.filter((s) => s.state != 'equal') || [];
            const report = BootstrapUtils.toYaml(differences);

            const differentContents = differences
                .filter(
                    (d) =>
                        d.state == 'distinct' &&
                        (d.reason == 'different-content' || d.reason == 'different-size') &&
                        d.type1 == 'file' &&
                        d.type2 == 'file' &&
                        d.path1 &&
                        d.path2,
                )
                .map((d) => {
                    console.log(d);
                    if (patch) {
                        copyFileSync(join(d.path1!, d.name1!), join(d.path2!, d.name2!));
                    }
                    const content1 = readFileSync(join(d.path1!, d.name1!), { encoding: 'utf-8' });
                    const content2 = readFileSync(join(d.path2!, d.name2!), { encoding: 'utf-8' });
                    return { ...d, content1, content2 };
                });

            if (differentContents.length) {
                const diff = differentContents.reduce(
                    (r, d) => {
                        return {
                            content1: `${r.content1}${join(d.path1!, d.name1!)}\n\n${d.content1}\n\n\n`,
                            content2: `${r.content2}${join(d.path2!, d.name2!)}\n\n${d.content2}\n\n\n`,
                        };
                    },
                    {
                        content1: '',
                        content2: '',
                    },
                );
                expect(diff.content1, `there are differences between folders!. Report:\n\n${report}`).equals(diff.content2);
            } else {
                expect(compareResult.differences, `there are differences between folders!. Report:\n\n${report}`).equals(0);
            }
        }
        await runConfig('reset', () => service.config({ ...config, upgrade: true, reset: true }));
        await runConfig('upgrade', () => service.config({ ...config, upgrade: true, reset: false }));
        await runConfig('upgrade no params', () =>
            service.config({
                report: true,
                offline: true,
                target: target,
                user: BootstrapUtils.CURRENT_USER,
                version: '1.0.8',
                upgrade: true,
                reset: false,
                privateKeyResolver: new DefaultPrivateKeyResolver(),
            }),
        );
    }
    const loader = new ConfigLoader();
    for (const preset of presets) {
        for (const assembly of assemblies) {
            const targetFolderName = `${preset}-${assembly}-target`;
            it(`${targetFolderName} test`, () => {
                return basicConfigTest(
                    preset,
                    assembly,
                    loader.mergePresets(
                        customPreset,
                        assembly == Assembly.multinode ? multinodeCustomPreset : undefined,
                        preset == Preset.dualCurrency
                            ? bootstrapCustomPreset
                            : preset == Preset.singleCurrency
                            ? singleCurrencyCustomPreset
                            : undefined,
                    ),
                    targetFolderName,
                );
            });
        }
    }

    for (const preset of [Preset.mainnet, Preset.testnet]) {
        for (const assembly of [Assembly.peer, Assembly.dual, Assembly.demo, Assembly.demo]) {
            const targetFolderName = `${preset}-${assembly}-voting-target`;
            it(`${targetFolderName} test`, () => {
                return basicConfigTest(
                    preset,
                    assembly,
                    loader.mergePresets(customPreset, {
                        nodes: [
                            {
                                friendlyName: 'myRegularNode',
                                host: 'myRegularNode.host.com',
                                voting: true,
                            },
                        ],
                    }),
                    targetFolderName,
                );
            });
        }
    }

    for (const preset of [Preset.mainnet, Preset.testnet]) {
        for (const assembly of [Assembly.dual]) {
            const targetFolderName = `${preset}-${assembly}-supernode-target`;
            it(`${targetFolderName} test`, () => {
                return basicConfigTest(
                    preset,
                    assembly,
                    loader.mergePresets(customPreset, {
                        nodes: [
                            {
                                friendlyName: 'mySupernode',
                                host: 'mySupernode.host.com',
                                voting: true,
                                rewardProgram: RewardProgram.SuperNode,
                            },
                        ],
                    }),
                    targetFolderName,
                );
            });
        }
    }

    for (const preset of ['test/unit-test-profiles/custom-network.yml']) {
        for (const assembly of [Assembly.dual, Assembly.multinode]) {
            const targetFolderName = `custom-network-${assembly}-target`;
            it(`${targetFolderName} test`, () => {
                return basicConfigTest(
                    preset,
                    assembly,
                    loader.mergePresets(
                        customPreset,
                        assembly == Assembly.multinode ? multinodeCustomPreset : undefined,
                        bootstrapCustomPreset,
                    ),
                    targetFolderName,
                );
            });
        }
    }
});
