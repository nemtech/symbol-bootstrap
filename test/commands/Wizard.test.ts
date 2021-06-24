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

import { expect } from '@oclif/test';
import { stdin } from 'mock-stdin';
import Wizard, { Network } from '../../src/commands/wizard';
import { CustomPreset, PrivateKeySecurityMode } from '../../src/model';
import { BootstrapUtils, Preset, RewardProgram } from '../../src/service';

export const StdUtils = {
    keys: Object.freeze({
        up: '\u001b[A',
        down: '\u001b[B',
        left: '\u001b[D',
        right: '\u001b[C',
    }),
    in: (responses: string[]) => {
        let k = 0;

        const s = stdin();
        function sendAnswer() {
            setTimeout(function () {
                const text = responses[k];
                if (typeof text !== 'string') {
                    throw new Error('Should give only text responses ' + JSON.stringify(responses, null, 2));
                }
                s.send(text);
                k += 1;
                if (k < responses.length) {
                    sendAnswer();
                }
            }, 0);
        }

        sendAnswer();
    },
};

describe('Wizard', () => {
    const testFolder = 'target/wizardTest';
    beforeEach(async () => {
        BootstrapUtils.deleteFolder(testFolder);
    });
    it('Provide private keys', async () => {
        // assembly
        StdUtils.in([
            '\n',
            '\n',
            StdUtils.keys.down,
            '\n',
            '\n',
            StdUtils.keys.down,
            '\n',
            'AAA3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1\n',
            'y\n',
            StdUtils.keys.down,
            '\n',
            'BBB3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1\n',
            'y\n',
            StdUtils.keys.down,
            '\n',
            'CCC3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1\n',
            'y\n',
            StdUtils.keys.down,
            '\n',
            'DDD3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1\n',
            'y\n',
            StdUtils.keys.down,
            '\n',
            'EEE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1\n',
            'y\n',
            'myhostname\n',
            'myfriendlyname\n',
            '\n',
            'y\n', //Voting!
            '\n',
            'n\n',
            'n\n',
        ]);

        const password = '11111';
        const customPresetFile = `${testFolder}/wizard-custom.yml`;
        await Wizard.execute(BootstrapUtils.resolveRootFolder(), {
            customPreset: customPresetFile,
            network: Network.mainnet,
            noPassword: false,
            skipPull: true,
            target: `${testFolder}/target`,
            password: password,
        });
        const expectedCustomPreset: CustomPreset = {
            assembly: 'dual',
            nodes: [
                {
                    friendlyName: 'myfriendlyname',
                    host: 'myhostname',
                    voting: true,
                    mainPrivateKey: 'AAA3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1',
                    remotePrivateKey: 'DDD3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1',
                    transportPrivateKey: 'BBB3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1',
                    vrfPrivateKey: 'CCC3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1',
                    agentPrivateKey: 'EEE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1',
                    rewardProgram: RewardProgram.SuperNode,
                },
            ],
            preset: Preset.mainnet,
            privateKeySecurityMode: PrivateKeySecurityMode.PROMPT_MAIN_TRANSPORT,
        };
        const customPreset = BootstrapUtils.loadYaml(customPresetFile, password);
        expect(customPreset).deep.eq(expectedCustomPreset);
    });

    it('Generate use seed keys voting', async () => {
        // assembly
        StdUtils.in([
            '\n',
            'y\n', //Are you offline.
            '\n',
            StdUtils.keys.down,
            StdUtils.keys.down,
            '\n',
            'dragon situate error grid farm obtain speak mail creek ridge arrange grid crew box sugar play cram ranch evoke include creek breeze shadow critic',
            '\n', // accept seed
            '\n', // address selection
            StdUtils.keys.down,
            StdUtils.keys.down,
            '\n',
            StdUtils.keys.down,
            StdUtils.keys.down,
            '\n',
            StdUtils.keys.down,
            StdUtils.keys.down,
            '\n',
            'myhostname\n',
            'myfriendlyname\n',
            '\n',
            'y\n',
            // '\n',
            // '\n',
            // 'y\n',
        ]);

        const customPresetFile = `${testFolder}/wizard-custom.yml`;
        const password = '11111';
        await Wizard.execute(BootstrapUtils.resolveRootFolder(), {
            customPreset: customPresetFile,
            network: Network.mainnet,
            noPassword: false,
            skipPull: true,
            target: `${testFolder}/target`,
            password: password,
        });
        const expectedCustomPreset: CustomPreset = {
            assembly: 'dual',
            nodes: [
                {
                    friendlyName: 'myfriendlyname',
                    host: 'myhostname',
                    mainPrivateKey: '91D8B10CC8F67FB4F42806DAAC59E57A074A999A8FC11F68230AD138AFC2E056',
                    remotePrivateKey: 'B4CA246A890EA7AF48A0D869398ECD042DDD9C6443F1D29CAB6638D1741F27A2',
                    transportPrivateKey: '5D487EB256C5D5B5C47E6884B9C22FAE4C8208B3742331369DCD4BE0423A29DF',
                    voting: true,
                    vrfPrivateKey: 'B47E0FD09B0D8566EA9058218E6CC57C0431913A9ED41E5D4FE131C54C8D306E',
                },
            ],
            preset: Preset.mainnet,
            privateKeySecurityMode: PrivateKeySecurityMode.PROMPT_MAIN_TRANSPORT,
        };
        const customPreset = BootstrapUtils.loadYaml(customPresetFile, password);
        expect(customPreset).deep.eq(expectedCustomPreset);
    });
});
