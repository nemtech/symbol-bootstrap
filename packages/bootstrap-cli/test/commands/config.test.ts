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

import { test } from '@oclif/test';

describe('config', () => {
    test.stdout()
        .command(['config', '-p', 'dualCurrency', '-r', '--password', '1111'])
        .it('runs config', (ctx) => {
            console.log(ctx.stdout);
        });
});

describe('config with opt in', () => {
    test.stdout()
        .command(['config', '-p', 'dualCurrency', '-r', '-c', './test/custom_preset.yml', '--noPassword'])
        .it('runs config', (ctx) => {
            console.log(ctx.stdout);
        });
});
