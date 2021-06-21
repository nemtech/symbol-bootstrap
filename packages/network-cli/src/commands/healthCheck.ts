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
import { Command, flags } from '@oclif/command';
import { IOptionFlag } from '@oclif/command/lib/flags';
import { IBooleanFlag } from '@oclif/parser/lib/flags';
import { LoggerFactory, LogType } from 'symbol-bootstrap-core';
import { NetworkHealthCheckService, NetworkUtils, Region } from 'symbol-network-core';
import { NetworkCommandUtils } from '../utils';

export class HealthCheck extends Command {
    private static onProcessListener = (() => {
        process.on('SIGINT', () => {
            console.log('bye bye');
            process.exit();
        });
    })();
    static description = `It health checks the nodes of the network once the network is running by performing several remote tests.`;

    static examples = [`$ ${NetworkCommandUtils.CLI_TOOL} healthCheck`];

    static flags: {
        help: IBooleanFlag<void>;
        timeout: IOptionFlag<number>;
        maxBlockDiff: IOptionFlag<number>;
        maxFinalizedBlockDiff: IOptionFlag<number>;
        region: IOptionFlag<Region | undefined>;
    } = {
        help: NetworkCommandUtils.helpFlag,
        timeout: flags.integer({ description: 'test timeout', default: 10000 }),
        maxBlockDiff: flags.integer({ description: 'max block diff', default: 10 }),
        maxFinalizedBlockDiff: flags.integer({ description: 'max finalized block diff', default: 5 }),
        region: flags.enum<Region>({ description: 'filter the report by region', required: false, options: Object.values(Region) }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(HealthCheck);
        NetworkCommandUtils.showBanner();
        const logger = LoggerFactory.getLogger(LogType.ConsoleLog);
        return new NetworkHealthCheckService(logger).healthCheck({ ...flags, input: NetworkUtils.DEFAULT_NETWORK_FILE });
    }
}
