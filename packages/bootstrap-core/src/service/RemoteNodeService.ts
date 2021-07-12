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
import { lookup } from 'dns';
import { ChainInfo, RepositoryFactory, RepositoryFactoryHttp } from 'symbol-sdk';
import { LogType } from '../logger';
import { Logger } from '../logger/Logger';
import { LoggerFactory } from '../logger/LoggerFactory';
import { ConfigPreset } from '../model';

const logger: Logger = LoggerFactory.getLogger(LogType.System);

export interface RepositoryInfo {
    repositoryFactory: RepositoryFactory;
    restGatewayUrl: string;
    chainInfo: ChainInfo;
}
export class RemoteNodeService {
    public async resolveCurrentFinalizationEpoch(presetData: ConfigPreset, offline: boolean): Promise<number> {
        if (offline) {
            return presetData.lastKnownNetworkEpoch;
        }
        const votingNode = presetData.nodes?.find((n) => n.voting);
        if (!votingNode) {
            return presetData.lastKnownNetworkEpoch;
        }
        const remoteNodeService = new RemoteNodeService();
        if (!(await remoteNodeService.isConnectedToInternet())) {
            return presetData.lastKnownNetworkEpoch;
        }
        return (await remoteNodeService.getBestFinalizationEpoch(presetData.knownRestGateways)) || presetData.lastKnownNetworkEpoch;
    }

    public async getBestFinalizationEpoch(urls: string[] | undefined): Promise<number | undefined> {
        if (!urls || !urls.length) {
            return undefined;
        }
        const repositoryInfo = this.sortByHeight(await this.getKnownNodeRepositoryInfos(urls)).find((i) => i);
        const finalizationEpoch = repositoryInfo?.chainInfo.latestFinalizedBlock.finalizationEpoch;
        if (finalizationEpoch) {
            logger.info(`The current network finalization epoch is ${finalizationEpoch}`);
        }
        return finalizationEpoch;
    }

    public async getBestRepositoryInfo(urls: string[]): Promise<RepositoryInfo> {
        const repositoryInfo = this.sortByHeight(await this.getKnownNodeRepositoryInfos(urls)).find((i) => i);
        if (!repositoryInfo) {
            throw new Error(`No up and running node could be found out of: \n - ${urls.join('\n - ')}`);
        }
        logger.info(`Connecting to node ${repositoryInfo.restGatewayUrl}`);
        return repositoryInfo;
    }

    private sortByHeight(repos: RepositoryInfo[]): RepositoryInfo[] {
        return repos
            .filter((b) => b.chainInfo)
            .sort((a, b) => {
                if (!a.chainInfo) {
                    return 1;
                }
                if (!b.chainInfo) {
                    return -1;
                }
                return b.chainInfo.height.compare(a.chainInfo.height);
            });
    }

    public isConnectedToInternet(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            lookup('google.com', (err) => {
                if (err && err.code == 'ENOTFOUND') {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    private async getKnownNodeRepositoryInfos(urls: string[]): Promise<RepositoryInfo[]> {
        logger.info(`Looking for the best node out of:  \n - ${urls.join('\n - ')}`);
        return (
            await Promise.all(
                urls.map(async (restGatewayUrl): Promise<RepositoryInfo | undefined> => {
                    const repositoryFactory = new RepositoryFactoryHttp(restGatewayUrl);
                    try {
                        const chainInfo = await repositoryFactory.createChainRepository().getChainInfo().toPromise();
                        return {
                            restGatewayUrl,
                            repositoryFactory,
                            chainInfo,
                        };
                    } catch (e) {
                        const message = `There has been an error talking to node ${restGatewayUrl}. Error: ${e.message}`;
                        logger.warn(message);
                        return undefined;
                    }
                }),
            )
        )
            .filter((i) => i)
            .map((i) => i as RepositoryInfo);
    }
}
