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
import { ComposeService } from '../../src/service';

describe('ComposeService', () => {
    it('resolveDebugOptions', async () => {
        const service = new ComposeService('.', ComposeService.defaultParams);
        expect(service.resolveDebugOptions(true, true)).deep.equals(ComposeService.DEBUG_SERVICE_PARAMS);
        expect(service.resolveDebugOptions(true, undefined)).deep.equals(ComposeService.DEBUG_SERVICE_PARAMS);
        expect(service.resolveDebugOptions(true, false)).deep.equals({});
        expect(service.resolveDebugOptions(false, true)).deep.equals(ComposeService.DEBUG_SERVICE_PARAMS);
        expect(service.resolveDebugOptions(false, undefined)).deep.equals({});
        expect(service.resolveDebugOptions(false, false)).deep.equals({});
    });
});
