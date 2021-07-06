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
import { deepStrictEqual } from 'assert';
import { promises as fsPromises, readFileSync } from 'fs';
import 'mocha';
import { join } from 'path';
import { Account, NetworkType } from 'symbol-sdk';
import { BootstrapUtils, CertificateMetadata, CertificateService, ConfigLoader, NodeCertificates, Preset } from '../../src/service';

describe('CertificateService', () => {
    it('getCertificates from output', async () => {
        const outputFile = `./test/certificates/output.txt`;
        const output = BootstrapUtils.loadFileAsText(outputFile);
        const certificates = CertificateService.getCertificates(output);
        deepStrictEqual(certificates, [
            {
                privateKey: '7B63F86AF5E33617C349832012F42FAC0102001A705E4842D0F615B1BA1C98A2',
                publicKey: 'D22DBD053E6913005DE2E59A3907C88CD6AB081B8BC1AC26EE24BDEB09B8BDA2',
            },
            {
                privateKey: '6ED4C590110285572FB60F1F2ADF50F2DF96991B0A72E86241B2D44B4CE7E696',
                publicKey: '5F4F8760D675F6836D4C07576F88B179BFE4471EDFBA4ECD2399C8F1EF02EE71',
            },
        ]);
    });

    it('createCertificates', async () => {
        const target = 'target/tests/CertificateService.test';
        await BootstrapUtils.deleteFolder(target);
        const service = new CertificateService('.', { target: target, user: await BootstrapUtils.getDockerUserGroup() });
        const presetData = new ConfigLoader().createPresetData({
            root: '.',
            preset: Preset.dualCurrency,
            password: 'abc',
        });
        const networkType = NetworkType.TEST_NET;
        const keys: NodeCertificates = {
            main: ConfigLoader.toConfig(
                Account.createFromPrivateKey('E095162875BB1D98CA5E0941670E01C1B0DBDF86DF7B3BEDA4A93635F8E51A03', networkType),
            ),
            transport: ConfigLoader.toConfig(
                Account.createFromPrivateKey('415F253ABF0FB2DFD39D7F409EFA2E88769873CAEB45617313B98657A1476A15', networkType),
            ),
        };

        const randomSerial = '4C87E5C49034B711E2DA38D116366829DA144B\n'.toLowerCase();
        await service.run(networkType, presetData.symbolServerImage, 'test-node', keys, target, randomSerial);

        const expectedMetadata: CertificateMetadata = {
            version: 1,
            transportPublicKey: keys.transport.publicKey,
            mainPublicKey: keys.main.publicKey,
        };
        expect(expectedMetadata).deep.eq(BootstrapUtils.loadYaml(join(target, 'metadata.yml'), false));

        const files = await fsPromises.readdir(target);
        expect(files).deep.eq([
            'ca.cert.pem',
            'ca.cnf',
            'ca.pubkey.pem',
            'metadata.yml',
            'node.cnf',
            'node.crt.pem',
            'node.csr.pem',
            'node.full.crt.pem',
            'node.key.pem',
        ]);

        const diffFiles = ['new_certs', 'ca.cert.pem', 'index.txt', 'node.crt.pem', 'node.full.crt.pem'];

        // Filtering out files that aren't the same
        files
            .filter((f) => diffFiles.indexOf(f) === -1)
            .forEach((f) => {
                expect(readFileSync(join(target, f)), `Different fields: ${f}`).deep.eq(readFileSync(join('test', 'nodeCertificates', f)));
            });
    });
});
