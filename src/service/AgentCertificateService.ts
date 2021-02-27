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

import { pki } from 'node-forge';
import { join } from 'path';
import { Crypto } from 'symbol-sdk';
import { LogType } from '../logger';
import Logger from '../logger/Logger';
import LoggerFactory from '../logger/LoggerFactory';
import { BootstrapUtils } from './BootstrapUtils';

export interface AgentCertificateParams {
    readonly target: string;
}

const logger: Logger = LoggerFactory.getLogger(LogType.System);

export class AgentCertificateService {
    constructor(protected readonly params: AgentCertificateParams) {}

    public async run(name: string, customCertFolder?: string): Promise<void> {
        const certFolder = customCertFolder || BootstrapUtils.getTargetNodesFolder(this.params.target, false, name, 'agent');
        await BootstrapUtils.mkdir(certFolder);
        await this.createCertificates(certFolder);
        logger.info(`Agent Certificate for node ${name} created`);
    }

    private async createCertificates(target: string): Promise<void> {
        const keys = pki.rsa.generateKeyPair(2048);
        const cert = pki.createCertificate();
        const privateKeyPem = pki.privateKeyToPem(keys.privateKey);
        cert.publicKey = keys.publicKey;

        // NOTE: serialNumber is the hex encoded value of an ASN.1 INTEGER.
        // Conforming CAs should ensure serialNumber is:
        // - no more than 20 octets
        // - non-negative (prefix a '00' if your value starts with a '1' bit)
        cert.serialNumber = '01' + Crypto.randomBytes(19).toString('hex'); // 1 octet = 8 bits = 1 byte = 2 hex chars
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 5); // adding 5 year of validity from now
        const attrs = [
            {
                name: 'commonName',
                value: 'example.org',
            },
            {
                name: 'countryName',
                value: 'US',
            },
            {
                shortName: 'ST',
                value: 'Texas',
            },
            {
                name: 'localityName',
                value: 'Austin',
            },
            {
                name: 'organizationName',
                value: 'Texas Toast Coffee Shop',
            },
            {
                shortName: 'OU',
                value: 'Test',
            },
        ];
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.setExtensions([
            {
                name: 'basicConstraints',
                cA: true,
            },
            {
                name: 'keyUsage',
                keyCertSign: true,
                digitalSignature: true,
                nonRepudiation: true,
                keyEncipherment: true,
                dataEncipherment: true,
            },
            {
                name: 'extKeyUsage',
                serverAuth: true,
                clientAuth: true,
                codeSigning: true,
                emailProtection: true,
                timeStamping: true,
            },
            {
                name: 'nsCertType',
                client: true,
                server: true,
                email: true,
                objsign: true,
                sslCA: true,
                emailCA: true,
                objCA: true,
            },
            {
                name: 'subjectKeyIdentifier',
            },
        ]);

        // self-sign certificate
        cert.sign(keys.privateKey);

        // Convert a Forge certificate to PEM
        const certificatePem = pki.certificateToPem(cert);
        await BootstrapUtils.writeTextFile(join(target, 'agent-crt.pem'), certificatePem);
        await BootstrapUtils.writeTextFile(join(target, 'agent-key.pem'), privateKeyPem);
    }
}
