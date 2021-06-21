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
import * as os from 'os';
import * as semver from 'semver';
import { BootstrapUtils, VerifyService } from '../../src/service';

describe('VerifyService', () => {
    const currentNodeJsVersion = process.versions.node;

    it('loadVersion', async () => {
        const service = new VerifyService();
        expect(service.loadVersion('Docker version 19.03.8, build afacb8b7f0')).eq('19.03.8');
        expect(service.loadVersion('Docker version 19.0.8, build afacb8b7f0')).eq('19.0.8');
        expect(service.loadVersion('Docker version 19 build a')).eq('19.0.0');
    });

    it('VerifyService verify current installation', async () => {
        const service = new VerifyService();
        const currentDockerVersion = await service.loadVersionFromCommand('docker --version');
        const currentDockerComposeVersion = await service.loadVersionFromCommand('docker-compose --version');
        expect(semver.valid(currentNodeJsVersion, service.semverOptions));
        expect(semver.valid(currentDockerVersion, service.semverOptions));
        expect(semver.valid(currentDockerComposeVersion, service.semverOptions));
        const report = await service.createReport();
        const expected = {
            lines: [
                {
                    header: 'NodeVersion',
                    message: currentNodeJsVersion,
                },
                {
                    header: 'Docker Version',
                    message: currentDockerVersion,
                },
                {
                    header: 'Docker Compose Version',
                    message: currentDockerComposeVersion,
                },
                {
                    header: 'Docker Run Test',
                    message: "Command 'docker run hello-world' executed!",
                },
                {
                    header: 'Sudo User Test',
                    message: 'Your are not the sudo user!',
                },
            ],
            platform: `${os.type()} - ${os.release()} - ${os.platform()}`,
        };
        expect(report).to.be.deep.eq(expected);
    });

    it('VerifyService verify current installation when too old', async () => {
        const expectedVersions = {
            node: '18.0.0',
            docker: '19.4.0',
            dockerCompose: '1.25.30',
        };
        const service = new VerifyService(BootstrapUtils.resolveRootFolder(), expectedVersions);
        const currentDockerVersion = await service.loadVersionFromCommand('docker --version');
        const currentDockerComposeVersion = await service.loadVersionFromCommand('docker-compose --version');
        expect(semver.valid(currentNodeJsVersion, service.semverOptions));
        expect(semver.valid(currentDockerVersion, service.semverOptions));
        expect(semver.valid(currentDockerComposeVersion, service.semverOptions));

        const report = await service.createReport();
        const expected = {
            lines: [
                {
                    header: 'NodeVersion',
                    message: currentNodeJsVersion,
                    recommendation: `At least version ${expectedVersions.node} is required. Currently installed version is ${currentNodeJsVersion}. Check https://nodejs.org/en/download/package-manager/`,
                },
                {
                    header: 'Docker Version',
                    message: currentDockerVersion,
                    recommendation: `At least version ${expectedVersions.docker} is required. Currently installed version is ${currentDockerVersion}. Check https://docs.docker.com/get-docker/`,
                },
                {
                    header: 'Docker Compose Version',
                    message: currentDockerComposeVersion,
                    recommendation: `At least version ${expectedVersions.dockerCompose} is required. Currently installed version is ${currentDockerComposeVersion}. Check https://docs.docker.com/compose/install/`,
                },
                {
                    header: 'Sudo User Test',
                    message: 'Your are not the sudo user!',
                },
            ],
            platform: `${os.type()} - ${os.release()} - ${os.platform()}`,
        };
        expect(report).to.be.deep.eq(expected);
    });
});
