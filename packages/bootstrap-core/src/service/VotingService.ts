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

import { join } from 'path';
import { LogType } from '../logger';
import { Logger } from '../logger/Logger';
import { LoggerFactory } from '../logger/LoggerFactory';
import { ConfigPreset, NodeAccount, NodePreset } from '../model';
import { BootstrapUtils } from './BootstrapUtils';
import { CatapultVotingKeyFileProvider, NativeVotingKeyFileProvider, VotingKeyFileProvider } from './VotingKeyFileProvider';
import { VotingUtils } from './VotingUtils';

export interface VotingParams {
    target: string;
    user: string;
    votingKeyFileProvider?: VotingKeyFileProvider;
}

const logger: Logger = LoggerFactory.getLogger(LogType.System);

export class VotingService {
    constructor(protected readonly params: VotingParams) {}

    public async run(
        presetData: ConfigPreset,
        nodeAccount: NodeAccount,
        nodePreset: NodePreset,
        currentNetworkEpoch: number | undefined,
        updateVotingKey: boolean | undefined,
        nemesisBlock: boolean,
    ): Promise<boolean> {
        const networkEpoch = currentNetworkEpoch || presetData.lastKnownNetworkEpoch || 1;
        const update = updateVotingKey === undefined ? presetData.autoUpdateVotingKeys : updateVotingKey;
        if (!nodePreset?.voting) {
            logger.info(`Node ${nodeAccount.name} is not voting.`);
            return false;
        }
        const target = this.params.target;
        const votingKeysFolder = join(BootstrapUtils.getTargetNodesFolder(target, true, nodeAccount.name), presetData.votingKeysDirectory);
        const votingKeyDesiredFutureLifetime = presetData.votingKeyDesiredFutureLifetime;
        const votingKeyDesiredLifetime = presetData.votingKeyDesiredLifetime;
        if (votingKeyDesiredFutureLifetime > votingKeyDesiredLifetime) {
            throw new Error(
                `votingKeyDesiredFutureLifetime (${votingKeyDesiredFutureLifetime}) cannot be greater than votingKeyDesiredLifetime (${votingKeyDesiredLifetime})`,
            );
        }
        await BootstrapUtils.mkdir(votingKeysFolder);
        const votingUtils = new VotingUtils();
        await BootstrapUtils.deleteFile(join(votingKeysFolder, 'metadata.yml'));
        const currentVotingFiles = votingUtils.loadVotingFiles(votingKeysFolder);
        const maxVotingKeyEndEpoch = Math.max(currentVotingFiles[currentVotingFiles.length - 1]?.endEpoch || 0, networkEpoch - 1);

        //This updates the addresses.yml data about existing voting files. If a user puts a manual file into the voting folder, this will update the yml file automatically.
        nodeAccount.voting = currentVotingFiles;

        if (maxVotingKeyEndEpoch > networkEpoch + votingKeyDesiredFutureLifetime) {
            logger.info(`Node ${nodeAccount.name}'s voting files are up-to-date.`);
            return false;
        }
        // First file is created automatically on start, second file may or may not.
        if (!update && currentVotingFiles.length > 0) {
            logger.warn('');
            logger.warn(`Voting key files are close to EXPIRATION or have EXPIRED!. Run the 'symbol-bootstrap updateVotingKeys' command!`);
            logger.warn('');
            return false;
        }
        const votingKeyStartEpoch = maxVotingKeyEndEpoch + 1;
        const votingKeyEndEpoch = maxVotingKeyEndEpoch + votingKeyDesiredLifetime;
        const epochs = votingKeyEndEpoch - votingKeyStartEpoch + 1;
        logger.info(`Creating Voting key file of ${epochs} epochs for node ${nodeAccount.name}. This could take a while!`);
        const privateKeyTreeFileName = `private_key_tree${currentVotingFiles.length + 1}.dat`;
        const provider =
            this.params.votingKeyFileProvider ||
            (presetData.useExperimentalNativeVotingKeyGeneration
                ? new NativeVotingKeyFileProvider(logger)
                : new CatapultVotingKeyFileProvider(logger, this.params.user));
        const votingKeyFile = await provider.createVotingFile({
            presetData: presetData,
            nodeAccount: nodeAccount,
            nodePreset: nodePreset,
            votingKeysFolder: votingKeysFolder,
            privateKeyTreeFileName: privateKeyTreeFileName,
            votingKeyStartEpoch: votingKeyStartEpoch,
            votingKeyEndEpoch: votingKeyEndEpoch,
        });

        if (nemesisBlock) {
            // For a new private network, voting keys are in the nemesisBlock.
            logger.info('');
            logger.info(
                `A new Voting File for the node ${nodeAccount.name} has been generated. The link transaction will be included in the nemesis block.`,
            );
            logger.info('');
        } else {
            // For a running network.
            logger.warn('');
            logger.warn(`A new Voting File for the node ${nodeAccount.name} has been generated! `);

            logger.warn(
                `Remember to send a Voting Key Link transaction from main ${nodeAccount.main.address} using the Voting Public Key: ${votingKeyFile.publicKey} with startEpoch: ${votingKeyStartEpoch} and endEpoch: ${votingKeyEndEpoch}`,
            );
            logger.warn(`For linking, you can use 'symbol-bootstrap link' command, the symbol cli, or the symbol desktop wallet.`);
            logger.warn('');
        }
        nodeAccount.voting = votingUtils.loadVotingFiles(votingKeysFolder);
        return true;
    }
}
