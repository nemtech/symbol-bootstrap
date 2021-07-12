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
import https from 'https';
import * as _ from 'lodash';
import { Socket } from 'net';
import { KeyName, Logger, RewardProgram } from 'symbol-bootstrap-core';
import { NodeStatusEnum } from 'symbol-openapi-typescript-fetch-client';
import { AccountLinkVotingKey, Address, FinalizationProof } from 'symbol-sdk';
import { NetworkUtils, NodeInformation, nodesMetadata, Region } from '../';

export interface ReportLine {
    readonly message: string;
    readonly status: 'error' | 'warning' | 'success' | 'info';
}

export class Report {
    readonly lines: ReportLine[] = [];
    error(message: string): void {
        this.lines.push({
            message,
            status: 'error',
        });
    }
    warning(message: string): void {
        this.lines.push({
            message,
            status: 'warning',
        });
    }
    success(message: string): void {
        this.lines.push({
            message,
            status: 'success',
        });
    }
    info(message: string): void {
        this.lines.push({
            message,
            status: 'info',
        });
    }
    add(report: Report, prefix = ''): void {
        report.lines.forEach((line) => {
            this.lines.push({
                message: `${prefix}${line.message}`,
                status: line.status,
            });
        });
    }
    withError(): boolean {
        return !!this.lines.find((l) => l.status === 'error');
    }
}

interface NodeData {
    height: number;
    finalizedHeight: number;
    finalizedEpoch: number;
    serverVersion: number;
    bestRestUrl: string;
}

export class NetworkHealthCheckService {
    constructor(private readonly logger: Logger) {}

    public async healthCheck(flags: {
        input: string;
        timeout: number;
        maxBlockDiff: number;
        maxFinalizedBlockDiff: number;
        region: Region | undefined;
    }): Promise<void> {
        const input = await NetworkUtils.loadNetwork(flags.input);
        const timeout = flags.timeout;
        const bestNodeInfo = await this.getBestNodeInfo(input.nodes, timeout);
        if (!bestNodeInfo.bestRestUrl) {
            throw new Error('There are not running nodes. Have you deployed?');
        }
        const bestNodeRepositoryFactory = NetworkUtils.createRepositoryFactory(bestNodeInfo.bestRestUrl, timeout);
        const finalizationData = await bestNodeRepositoryFactory
            .createFinalizationRepository()
            .getFinalizationProofAtEpoch(bestNodeInfo.finalizedEpoch)
            .toPromise();

        const reports = await Promise.all(
            input.nodes.map(async (node) => {
                const report = new Report();
                report.info(`Testing node ${node.hostname}`);
                const metadata = nodesMetadata[node.nodeType];
                report.add(await this.testServer(node, timeout));
                if (metadata.api) {
                    report.add(await this.testRestGateway(node, bestNodeInfo, timeout, flags.maxBlockDiff, flags.maxFinalizedBlockDiff));
                }
                if (this.getRewardProgram(node)) {
                    report.add(await this.testAgent(node, timeout));
                }
                report.add(await this.testAccounts(node, bestNodeInfo, timeout));
                if (metadata.voting) {
                    report.add(await this.testFinalization(node, finalizationData));
                }
                return { node: node, report: report };
            }),
        );

        reports.forEach((r) => {
            this.logger.info('--------');
            r.report.lines.forEach((line) => {
                if (line.status === 'error') this.logger.error(`${line.message}`);
                if (line.status === 'warning') this.logger.warn(`${line.message}`);
                if (line.status === 'success') this.logger.info(`${line.message}`);
                if (line.status === 'info') this.logger.info(`${line.message}`);
            });
        });
        const failed = reports.filter((r) => r.report.withError());
        if (failed.length) {
            this.logger.error('');
            this.logger.error('THERE HAS BEEN SOME ERRORS: Summary:');
            this.logger.error('');
            failed.forEach((r) => {
                this.logger.error('--------');
                this.logger.error(`${r.node.hostname}`);
                r.report.lines.forEach((line) => {
                    if (line.status === 'error') this.logger.error(`${line.message}`);
                });
            });
            process.exit(100);
        } else {
            this.logger.info('');
            this.logger.info('Nodes looks ok!');
            this.logger.info('');
            process.exit(0);
        }
    }

    private getRewardProgram(node: NodeInformation): RewardProgram | undefined {
        return node.customPreset?.nodes?.[0].rewardProgram;
    }

    private async getBestNodeInfo(nodes: NodeInformation[], timeout: number): Promise<NodeData> {
        const values = await Promise.all(
            nodes
                .filter((node) => {
                    const metadata = nodesMetadata[node.nodeType];
                    return metadata.api;
                })
                .map(async (node) => {
                    try {
                        const url = NetworkUtils.resolveRestUrl(node.hostname);
                        const repositoryFactory = NetworkUtils.createRepositoryFactory(url, timeout);
                        const chainInfo = await repositoryFactory.createChainRepository().getChainInfo().toPromise();
                        const nodeInfo = await repositoryFactory.createNodeRepository().getNodeInfo().toPromise();
                        return {
                            height: chainInfo.height.compact(),
                            finalizedHeight: chainInfo.latestFinalizedBlock.height.compact(),
                            finalizedEpoch: chainInfo.latestFinalizedBlock.finalizationEpoch,
                            serverVersion: nodeInfo.version,
                            bestRestUrl: url,
                        };
                    } catch (e) {
                        return {
                            height: 0,
                            finalizedHeight: 0,
                            finalizedEpoch: 0,
                            serverVersion: 0,
                            bestRestUrl: '',
                        };
                    }
                }),
        );

        return values.reduce(
            (a, b) => {
                return {
                    height: Math.max(a.height, b.height),
                    finalizedHeight: Math.max(a.finalizedHeight, b.finalizedHeight),
                    finalizedEpoch: Math.max(a.finalizedEpoch, b.finalizedEpoch),
                    serverVersion: Math.max(a.serverVersion, b.serverVersion),
                    bestRestUrl: a.height > b.height ? a.bestRestUrl : b.bestRestUrl,
                };
            },
            { height: 0, finalizedHeight: 0, finalizedEpoch: 0, serverVersion: 0, bestRestUrl: '' },
        );
    }

    private async testRestGateway(
        node: NodeInformation,
        maxNodeData: NodeData,
        timeout: number,
        maxBlockDiff: number,
        maxFinalizedBlockDiff: number,
    ): Promise<Report> {
        const report = new Report();
        const url = NetworkUtils.resolveRestUrl(node.hostname);
        const repositoryFactory = NetworkUtils.createRepositoryFactory(url, timeout);
        const nodeRepository = repositoryFactory.createNodeRepository();
        const testUrl = `${url}/node/health`;
        report.success(`Testing ${testUrl}`);
        try {
            const healthStatus = await nodeRepository.getNodeHealth().toPromise();
            if (healthStatus.apiNode === NodeStatusEnum.Down) {
                report.error(`Rest ${testUrl} is NOT up and running: Api Node is still Down!`);
            } else if (healthStatus.db === NodeStatusEnum.Down) {
                report.error(`Rest ${testUrl} is NOT up and running: DB is still Down!`);
            } else {
                report.success(`Rest ${testUrl} is up and running...`);
            }
        } catch (e) {
            report.error(`Rest ${testUrl} is NOT up and running: ${e.message}`);
        }

        try {
            const chainInfo = await repositoryFactory.createChainRepository().getChainInfo().toPromise();
            const nodeHeight = chainInfo.height.compact();
            const nodeFinalizedHeight = chainInfo.latestFinalizedBlock.height.compact();
            const nodeFinalizationEpoch = chainInfo.latestFinalizedBlock.finalizationEpoch;

            if (nodeHeight < maxNodeData.height - maxBlockDiff) {
                report.error(`Node ${node.hostname} height is ${nodeHeight} when current is ${maxNodeData.height}`);
            } else {
                report.success(`Node ${node.hostname} height is ${nodeHeight} out of ${maxNodeData.height}`);
            }
            if (nodeFinalizedHeight < maxNodeData.finalizedHeight - maxFinalizedBlockDiff) {
                report.error(
                    `Node ${node.hostname} finalized height is ${nodeFinalizedHeight} when current is ${maxNodeData.finalizedHeight}`,
                );
            } else {
                report.success(`Node ${node.hostname} finalized height is ${nodeFinalizedHeight} out of ${maxNodeData.finalizedHeight}`);
            }
            if (nodeFinalizationEpoch < maxNodeData.finalizedEpoch - 1) {
                report.error(
                    `Node ${node.hostname} finalized epoch is ${nodeFinalizationEpoch} when current is ${maxNodeData.finalizedEpoch}`,
                );
            } else {
                report.success(`Node ${node.hostname} finalized epoch is ${nodeFinalizationEpoch} out of ${maxNodeData.finalizedEpoch}`);
            }
        } catch (e) {
            report.error(`Rest ${url}/chain/info error: ${e.message}`);
        }

        try {
            const nodeInfo = await repositoryFactory.createNodeRepository().getNodeInfo().toPromise();
            if (nodeInfo.version < maxNodeData.serverVersion) {
                report.error(`Node ${node.hostname} version is ${nodeInfo.version} when current is ${maxNodeData.serverVersion}`);
            } else {
                report.success(`Node ${node.hostname} version is ${nodeInfo.version} out of ${maxNodeData.serverVersion}`);
            }
        } catch (e) {
            report.error(`Rest ${url}/node/info error: ${e.message}`);
        }
        return report;
    }

    private async testAccounts(node: NodeInformation, maxNodeData: NodeData, timeout: number): Promise<Report> {
        const report = new Report();
        const metadata = nodesMetadata[node.nodeType];
        if (!metadata.voting && !metadata.harvesting) {
            return report;
        }
        const url = maxNodeData.bestRestUrl;
        const repositoryFactory = NetworkUtils.createRepositoryFactory(url, timeout);
        if (!node.addresses?.main.address) {
            throw new Error('node.addresses?.main.address must be defined');
        }
        const address = Address.createFromRawAddress(node.addresses.main.address);
        const accountRepository = repositoryFactory.createAccountRepository();
        report.success(`Testing accounts ${url}/accounts/${address.plain()}`);
        const verify = (keyName: KeyName, expectedKey: string | undefined, currentKey: string | undefined) => {
            if (expectedKey === currentKey) {
                report.success(`${keyName} is correct, value ${currentKey}`);
            } else {
                report.error(`${keyName} is invalid, expected ${expectedKey} but got ${currentKey}`);
            }
        };
        const verifyVoting = (expected: AccountLinkVotingKey, current: AccountLinkVotingKey, keyNumber: number) => {
            const expectedKey = Object.values(expected).join(' - ');
            const currentKey = Object.values(current).join(' - ');
            if (expectedKey === currentKey) {
                report.success(`Voting Key ${keyNumber} is correct, current is ${currentKey}`);
            } else {
                report.error(`Voting Key ${keyNumber} is invalid, expected ${expectedKey} but got ${currentKey}`);
            }
        };
        try {
            const accountInfo = await accountRepository.getAccountInfo(address).toPromise();
            if (metadata.harvesting) {
                verify(KeyName.VRF, node.addresses?.vrf?.publicKey, accountInfo.supplementalPublicKeys.vrf?.publicKey);
                verify(KeyName.Remote, node.addresses?.remote?.publicKey, accountInfo.supplementalPublicKeys.linked?.publicKey);
            }
            if (metadata.voting) {
                const expectedVotingData: AccountLinkVotingKey[] = (node.addresses?.voting?.map(({ filename, ...k }) => k) || [])
                    .sort((a, b) => a.startEpoch - b.startEpoch)
                    .filter((a) => a.endEpoch >= maxNodeData.finalizedEpoch)
                    .slice(0, 3);
                const currentVotingData: AccountLinkVotingKey[] = (accountInfo.supplementalPublicKeys.voting || [])
                    .sort((a, b) => a.startEpoch - b.startEpoch)
                    .filter((a) => a.endEpoch >= maxNodeData.finalizedEpoch);
                if (expectedVotingData.length != currentVotingData.length) {
                    report.error(`Expected voting keys is ${expectedVotingData.length} but got ${currentVotingData.length}`);
                }
                _.zip(expectedVotingData, currentVotingData).forEach(
                    ([expected, current], index) => expected && current && verifyVoting(expected, current, index + 1),
                );

                const currentVotingKey = currentVotingData.find(
                    (v) => v.startEpoch <= maxNodeData.finalizedEpoch && maxNodeData.finalizedEpoch <= v.endEpoch,
                );
                if (currentVotingKey) {
                    report.info(
                        `The current voting key will expire in ${currentVotingKey.endEpoch - maxNodeData.finalizedEpoch} epochs at epoch ${
                            currentVotingKey.endEpoch
                        }`,
                    );
                } else {
                    report.error(`There is not active voting key at epoch ${maxNodeData.finalizedEpoch}!!!!`);
                }
            }
        } catch (e) {
            report.error(`Account ${node.addresses?.main.address} could not be loaded. Error: ${e.message}`);
        }
        return report;
    }

    private async testAgent(node: NodeInformation, timeout: number): Promise<Report> {
        const report = new Report();
        const url = `https://${node.hostname}:7881`;
        const testUrl = `${url}/metadata`;
        report.info(`Testing ${testUrl}`);
        try {
            const response = await new Promise<string>((resolve, reject) => {
                try {
                    const req = https.request(testUrl, { rejectUnauthorized: false, timeout: timeout }, (res) => {
                        let str = '';
                        res.on('data', (chunk) => {
                            str += chunk;
                        });

                        res.on('end', () => {
                            resolve(str);
                        });
                    });
                    req.on('error', reject);
                    req.end();
                } catch (e) {
                    reject(e);
                }
            });
            const metadata = JSON.parse(response);
            if (metadata.authorized || !metadata.rewardProgram || !metadata.mainPublicKey) {
                report.error(`Agent ${testUrl} is NOT up and running: Invalid response ${response}`);
            } else {
                const rewardProgram = this.getRewardProgram(node);
                if (metadata.rewardProgram !== rewardProgram) {
                    report.error(
                        `Agent ${testUrl} is NOT up and running: Invalid reward program, expected ${rewardProgram} but got ${metadata.rewardProgram}`,
                    );
                } else {
                    report.success(`Agent ${testUrl} is up and running...`);
                }
            }
        } catch (e) {
            report.error(`Agent ${testUrl} is NOT up and running: ${e.message}`);
        }
        return report;
    }

    private async testFinalization(node: NodeInformation, finalizationData: FinalizationProof): Promise<Report> {
        const report = new Report();
        report.info(`Testing finalization ${finalizationData.finalizationEpoch}`);
        const votingFile = node.addresses?.voting?.find(
            (v) => v.startEpoch <= finalizationData.finalizationEpoch && finalizationData.finalizationEpoch <= v.endEpoch,
        );
        if (votingFile) {
            const messageGroup = finalizationData.messageGroups.find((g) =>
                g.signatures.find((s) => s.root.parentPublicKey.toUpperCase() === votingFile.publicKey.toUpperCase()),
            );
            if (messageGroup) {
                report.success(
                    `Voting public key ${votingFile.publicKey} has been used to finalize epoch ${finalizationData.finalizationEpoch}`,
                );
            } else {
                report.error(
                    `Voting public key ${votingFile.publicKey} has NOT been used to finalize epoch ${finalizationData.finalizationEpoch}`,
                );
            }
        } else {
            report.error(`There is no voting file at epoch ${finalizationData.finalizationEpoch}`);
        }
        return report;
    }

    private async testServer(node: NodeInformation, timeout: number): Promise<Report> {
        const report = new Report();
        const port = 7900;
        const host = node.hostname;
        report.success(`Testing ${host} port ${port}`);
        const sock = new Socket();
        sock.setTimeout(timeout);
        return new Promise<Report>((resolve) => {
            sock.on('connect', () => {
                report.success(`${host} port ${port} is up.`);
                sock.destroy();
                resolve(report);
            })
                .on('error', (e) => {
                    report.error(`${host} port ${port} is down: ${e.message}`);
                    resolve(report);
                })
                .on('timeout', () => {
                    report.error(`${host} port ${port} is down: timeout`);
                    resolve(report);
                })
                .connect({
                    host,
                    port,
                });
        });
    }
}
