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
import 'mocha';
import { BootstrapService, Preset, StartParams } from '../../src/service';

describe('BootstrapService', () => {
    it(' bootstrap config compose non aws', async () => {
        const service = new BootstrapService();
        const config: StartParams = {
            report: false,
            composeResolvePassword: false,
            preset: Preset.bootstrap,
            reset: true,
            upgrade: false,
            timeout: 60000 * 5,
            target: 'target/tests/BootstrapService.standard',
            detached: true,
            user: 'current',
        };

        const configResult = await service.config(config);
        expect(configResult.presetData).to.not.null;
        expect(configResult.addresses).to.not.null;
        const dockerCompose = await service.compose(config);
        expect(dockerCompose).to.not.undefined;
    });
});
