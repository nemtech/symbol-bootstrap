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

import { Command, flags } from '@oclif/command';
import { BootstrapService, RunService } from 'symbol-bootstrap-core';
import { CommandUtils } from '../service/CommandUtils';
import HealthCheck from './healthCheck';

export default class Run extends Command {
    static description =
        'It boots the network via docker using the generated `docker-compose.yml` file and configuration. The config and compose methods/commands need to be called before this method. This is just a wrapper for the `docker-compose up` bash call.';

    static examples = [`$ symbol-bootstrap run`];

    static flags = {
        help: CommandUtils.helpFlag,
        target: CommandUtils.targetFlag,
        detached: flags.boolean({
            char: 'd',
            description:
                'If provided, docker-compose will run with -d (--detached) and this command will wait unit server is running before returning',
        }),

        healthCheck: flags.boolean({
            description: HealthCheck.description,
        }),

        resetData: flags.boolean({
            description: 'It reset the database and node data but keeps the generated configuration, keys, voting tree files and block 1',
        }),

        pullImages: flags.boolean({
            description: 'It pulls the images from DockerHub when running the configuration. It only affects alpha/dev docker images.',
            default: RunService.defaultParams.pullImages,
        }),

        args: flags.string({
            multiple: true,
            description: 'Add extra arguments to the docker-compose up command. Check out https://docs.docker.com/compose/reference/up.',
        }),

        build: flags.boolean({
            char: 'b',
            description: 'If provided, docker-compose will run with -b (--build)',
        }),

        timeout: flags.integer({
            description: 'If running in detached mode, how long before timing out (in milliseconds)',
            default: RunService.defaultParams.timeout,
        }),
    };

    public run(): Promise<void> {
        const { flags } = this.parse(Run);
        CommandUtils.showBanner();
        return new BootstrapService().run(flags);
    }
}
