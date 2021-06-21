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

import { KnownError } from '../service';

export enum RewardProgram {
    EarlyAdoption = 'EarlyAdoption',
    Ecosystem = 'Ecosystem',
    SuperNode = 'SuperNode',
    MonitorOnly = 'MonitorOnly',
}
export class RewardProgramUtils {
    public static getRewardProgram(value: string): RewardProgram {
        const programs = Object.values(RewardProgram) as RewardProgram[];
        const program = programs.find((p) => p.toLowerCase() == value.toLowerCase());
        if (program) {
            return program;
        }
        throw new KnownError(`${value} is not a valid Reward program. Please use one of ${programs.join(', ')}`);
    }
}
