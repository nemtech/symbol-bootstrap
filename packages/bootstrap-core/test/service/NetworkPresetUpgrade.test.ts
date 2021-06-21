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
import { it } from 'mocha';
import { ConfigPreset } from '../../src/model';
import { BootstrapUtils, Preset, RemoteNodeService } from '../../src/service';

describe('NetworkPresetUpgrade', () => {
    const patchNetworkPreset = async (preset: Preset): Promise<void> => {
        const root = './';
        const presetLocation = `${root}/presets/${preset}/network.yml`;
        const networkPreset: ConfigPreset = BootstrapUtils.loadYaml(presetLocation, false);

        const epoch = await new RemoteNodeService().getBestFinalizationEpoch(networkPreset.knownRestGateways);
        if (!epoch) {
            throw new Error('Epoch could not be resolved!!');
        }
        networkPreset.lastKnownNetworkEpoch = epoch;
        await BootstrapUtils.writeYaml(presetLocation, networkPreset, undefined);
    };
    it.skip('should patch testnet lastKnownNetworkEpoch', () => {
        return patchNetworkPreset(Preset.testnet);
    });
    it.skip('should patch mainnet lastKnownNetworkEpoch', () => {
        return patchNetworkPreset(Preset.mainnet);
    });
});
