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
import { RewardProgram, RewardProgramUtils } from '../../src/service';

describe('RewardProgramUtils', () => {
    it('getRewardProgram', async () => {
        expect(RewardProgramUtils.getRewardProgram('ecosystem')).eq(RewardProgram.Ecosystem);
        expect(RewardProgramUtils.getRewardProgram('Ecosystem')).eq(RewardProgram.Ecosystem);
        expect(RewardProgramUtils.getRewardProgram('superNODE')).eq(RewardProgram.SuperNode);
        expect(RewardProgramUtils.getRewardProgram('earlyAdoption')).eq(RewardProgram.EarlyAdoption);
        try {
            RewardProgramUtils.getRewardProgram('NA');
            expect(1).eq(0);
        } catch (e) {
            expect(e.message).eq('NA is not a valid Reward program. Please use one of EarlyAdoption, Ecosystem, SuperNode, MonitorOnly');
        }
    });
});
