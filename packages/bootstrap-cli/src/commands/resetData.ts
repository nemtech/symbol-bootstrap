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

import { Command } from '@oclif/command';
import { BootstrapService } from 'symbol-bootstrap-core';
import { CommandUtils } from '../service/CommandUtils';

export default class ResetData extends Command {
    static description = 'It removes the data keeping the generated configuration, certificates, keys and block 1.';

    static examples = [`$ symbol-bootstrap resetData`];

    static flags = {
        help: CommandUtils.helpFlag,
        target: CommandUtils.targetFlag,
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(ResetData);
        CommandUtils.showBanner();
        await new BootstrapService().resetData(flags);
    }
}
