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
import { promises as fsPromises } from 'fs';
import 'mocha';
import { BootstrapUtils } from '../../src/service';
import { AgentCertificateService } from '../../src/service/AgentCertificateService';

describe('AgentCertificateService', () => {
    it('createCertificate', async () => {
        const target = 'target/tests/AgentCertificateService';
        await BootstrapUtils.deleteFolder(target);
        await BootstrapUtils.mkdir(target);
        const service = new AgentCertificateService({ target: target });

        await service.run('supernode', target);

        const files = await fsPromises.readdir(target);
        expect(files).deep.eq(['agent-crt.pem', 'agent-key.pem']);
    });
});
