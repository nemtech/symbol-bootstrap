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

import { expect } from 'chai';
import { promises as fsPromises, readFileSync } from 'fs';
import 'mocha';
import { join } from 'path';
import { AgentCertificateService, BootstrapUtils, ConfigLoader, DefaultPrivateKeyResolver, Preset } from '../../src/service';

describe('AgentCertificateService', () => {
    it('createCertificate', async () => {
        const target = 'target/tests/AgentCertificateService';
        await BootstrapUtils.deleteFolder(target);
        await BootstrapUtils.mkdir(target);
        const service = new AgentCertificateService('.', {
            target: target,
            user: await BootstrapUtils.getDockerUserGroup(),
            privateKeyResolver: new DefaultPrivateKeyResolver(),
        });

        const presetData = new ConfigLoader().createPresetData({
            root: '.',
            preset: Preset.dualCurrency,
            password: 'abc',
        });

        await service.run(
            presetData.networkType,
            presetData.symbolServerImage,
            'supernode',
            {
                agent: {
                    privateKey: '8D1929CAC89295BE7DBE26B7F830AA42A74D75D7055117DF2973001E3271BDD9',
                    publicKey: '04794EE7BD0810057870C7739C985D42BB4AAA4B1B9E3A71BFE6373A72D63726',
                },
            },
            target,
        );

        const files = await fsPromises.readdir(target);
        expect(files).deep.eq([
            'agent-ca.cnf',
            'agent-ca.csr.pem',
            'agent-ca.key.pem',
            'agent-ca.pubkey.pem',
            'agent-comm.cnf',
            'metadata.yml',
        ]);

        files.forEach((f) => {
            expect(readFileSync(join(target, f))).deep.eq(readFileSync(join('test', 'agentCertificates', f)));
        });
    });
});
