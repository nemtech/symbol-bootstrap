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
import * as os from 'os';
import * as semver from 'semver';
import { BootstrapUtils } from './BootstrapUtils';
export interface VerifyReport {
    platform: string;
    lines: ReportLine[];
}

export interface ReportLine {
    header: string;
    message: string;
    recommendation?: string;
}

export interface ExpectedVersions {
    node: string;
    docker: string;
    dockerCompose: string;
}

const defaultExpectedVersions: ExpectedVersions = {
    node: '12.0.0',
    docker: '18.3.0',
    dockerCompose: '1.25.0',
};

export class VerifyService {
    private readonly expectedVersions: ExpectedVersions;
    public readonly semverOptions = { loose: true };

    constructor(private readonly root = BootstrapUtils.resolveRootFolder(), expectedVersions: Partial<ExpectedVersions> = {}) {
        this.expectedVersions = { ...defaultExpectedVersions, ...expectedVersions };
    }

    public async createReport(): Promise<VerifyReport> {
        const lines: ReportLine[] = [];
        const platform = `${os.type()} - ${os.release()} - ${os.platform()}`;
        lines.push(await this.testNodeJs());
        const docker = await this.testDocker();
        lines.push(docker);
        lines.push(await this.testDockerCompose());
        if (!docker.recommendation) lines.push(await this.testDockerRun());
        if (!BootstrapUtils.isWindows()) {
            lines.push(await this.testSudo());
        }
        return { lines, platform };
    }

    public loadVersion(text: string): string | undefined {
        return text
            .replace(',', '')
            .split(' ')
            .map((word) => {
                const coerce = semver.coerce(word.trim(), this.semverOptions);
                return coerce?.raw;
            })
            .find((a) => a)
            ?.trim();
    }

    public async testNodeJs(): Promise<ReportLine> {
        const header = 'NodeVersion';
        const recommendationUrl = `https://nodejs.org/en/download/package-manager/`;
        const output = process.versions.node;
        return this.verifyInstalledApp(async () => output, header, this.expectedVersions.node, recommendationUrl);
    }

    public async testDocker(): Promise<ReportLine> {
        const header = 'Docker Version';
        const command = 'docker --version';
        const recommendationUrl = `https://docs.docker.com/get-docker/`;
        return this.verifyInstalledApp(
            async () => await this.loadVersionFromCommand(command),
            header,
            this.expectedVersions.docker,
            recommendationUrl,
        );
    }
    public async testDockerCompose(): Promise<ReportLine> {
        const header = 'Docker Compose Version';
        const command = 'docker-compose --version';
        const recommendationUrl = `https://docs.docker.com/compose/install/`;
        return this.verifyInstalledApp(
            async () => await this.loadVersionFromCommand(command),
            header,
            this.expectedVersions.dockerCompose,
            recommendationUrl,
        );
    }

    public async testDockerRun(): Promise<ReportLine> {
        const header = 'Docker Run Test';
        const command = 'docker run hello-world';
        const recommendationUrl = `https://www.digitalocean.com/community/questions/how-to-fix-docker-got-permission-denied-while-trying-to-connect-to-the-docker-daemon-socket`;

        try {
            const output = (await BootstrapUtils.exec(command)).stdout.trim();
            const expectedText = 'Hello from Docker!';
            if (output.indexOf(expectedText) == -1) {
                return {
                    header,
                    message: `Command '${command}' could not be executed: Error: '${expectedText}' not in output text \n${output}`,
                    recommendation: `Please check ${recommendationUrl}`,
                };
            }
            return { header, message: `Command '${command}' executed!` };
        } catch (e) {
            return {
                header,
                message: `Command '${command}' could not be executed: Error: ${e.message}`,
                recommendation: `Please check ${recommendationUrl}`,
            };
        }
    }

    public async testSudo(): Promise<ReportLine> {
        const header = 'Sudo User Test';
        if (BootstrapUtils.isRoot()) {
            return {
                header,
                message: `Your are running with the sudo user!`,
                recommendation: `Either don't use sudo or create a non sudo user to run Bootstrap.`,
            };
        }
        return { header, message: `Your are not the sudo user!` };
    }

    public async loadVersionFromCommand(command: string): Promise<string | undefined> {
        return this.loadVersion((await BootstrapUtils.exec(command)).stdout.trim());
    }

    private async verifyInstalledApp(
        versionLoader: () => Promise<string | undefined>,
        header: string,
        minVersion: string,
        recommendationUrl: string,
    ): Promise<ReportLine> {
        try {
            const version = await versionLoader();
            if (!version) {
                return {
                    header,
                    message: `Version could not be found! Output: ${versionLoader}`,
                    recommendation: `At least version ${minVersion} is required. Check ${recommendationUrl}`,
                };
            }
            if (semver.lt(version, minVersion, this.semverOptions)) {
                return {
                    header,
                    message: version,
                    recommendation: `At least version ${minVersion} is required. Currently installed version is ${version}. Check ${recommendationUrl}`,
                };
            }
            return { header, message: version };
        } catch (e) {
            return {
                header,
                message: `Error: ${e.message}`,
                recommendation: `At least version ${minVersion} is required. Check ${recommendationUrl}`,
            };
        }
    }
}
