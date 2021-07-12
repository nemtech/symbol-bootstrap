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
import { it } from 'mocha';
import { LinkAction } from 'symbol-sdk';
import { GenericNodeAccount, KeyAccount, LinkTransactionGenericFactory, LoggerFactory, LogType, VotingKeyAccount } from '../../src';

const logger = LoggerFactory.getLogger(LogType.System);

type GenericTransaction =
    | { name: string; action: LinkAction; publicKey: string }
    | { readonly endEpoch: number; name: string; action: LinkAction; readonly publicKey: string; readonly startEpoch: number };

describe('LinkTransactionGenericFactory', () => {
    it('should test overlaps', () => {
        expect(
            LinkTransactionGenericFactory.overlapsVotingAccounts(
                { startEpoch: 1, endEpoch: 10, publicKey: 'A' },
                { startEpoch: 1, endEpoch: 2, publicKey: 'A' },
            ),
        ).true;

        expect(
            LinkTransactionGenericFactory.overlapsVotingAccounts(
                { startEpoch: 1, endEpoch: 4, publicKey: 'A' },
                { startEpoch: 4, endEpoch: 10, publicKey: 'A' },
            ),
        ).true;

        expect(
            LinkTransactionGenericFactory.overlapsVotingAccounts(
                { startEpoch: 1, endEpoch: 4, publicKey: 'A' },
                { startEpoch: 5, endEpoch: 10, publicKey: 'A' },
            ),
        ).false;

        expect(
            LinkTransactionGenericFactory.overlapsVotingAccounts(
                { startEpoch: 11, endEpoch: 20, publicKey: 'A' },
                { startEpoch: 5, endEpoch: 10, publicKey: 'A' },
            ),
        ).false;

        expect(
            LinkTransactionGenericFactory.overlapsVotingAccounts(
                { startEpoch: 10, endEpoch: 20, publicKey: 'A' },
                { startEpoch: 5, endEpoch: 10, publicKey: 'A' },
            ),
        ).true;
    });
    const remoteTransactionFactory = (account: KeyAccount, action: LinkAction) => ({ ...account, action, name: 'remote' });
    const vrfTransactionFactory = (account: KeyAccount, action: LinkAction) => ({ ...account, action, name: 'vrf' });
    const votingKeyTransactionFactory = (account: VotingKeyAccount, action: LinkAction) => ({ ...account, action, name: 'voting' });

    it('creates generic transactions when empty', async () => {
        const currentLinkedAccounts: GenericNodeAccount = {};
        const toLinkNodeAccounts: GenericNodeAccount = {};
        const transactions = await new LinkTransactionGenericFactory(logger, async () => true, {
            unlink: false,
        }).createGenericTransactions(
            'SomeName',
            currentLinkedAccounts,
            toLinkNodeAccounts,
            1,
            remoteTransactionFactory,
            vrfTransactionFactory,
            votingKeyTransactionFactory,
        );
        expect(transactions).deep.equals([]);
    });

    const basicTest = async (
        currentLinkedAccounts: GenericNodeAccount,
        toLinkNodeAccounts: GenericNodeAccount,
        latestFinalizedBlockEpoch: number,
        unlink: boolean,
        expectedTransactions: GenericTransaction[],
    ) => {
        const transactions: GenericTransaction[] = await new LinkTransactionGenericFactory(logger, async () => true, {
            unlink: unlink,
        }).createGenericTransactions(
            'SomeName',
            currentLinkedAccounts,
            toLinkNodeAccounts,
            latestFinalizedBlockEpoch,
            remoteTransactionFactory,
            vrfTransactionFactory,
            votingKeyTransactionFactory,
        );
        console.log(JSON.stringify(transactions));
        expect(transactions).deep.equals(expectedTransactions);
    };

    it('creates generic transactions when VRF and Remote', async () => {
        const currentLinkedAccounts: GenericNodeAccount = {};
        const toLinkNodeAccounts: GenericNodeAccount = {
            remote: {
                publicKey: 'remote1',
            },
            vrf: {
                publicKey: 'vrf1',
            },
        };
        const expectedTransactions = [
            {
                action: LinkAction.Link,
                publicKey: 'remote1',
                name: 'remote',
            },
            {
                action: LinkAction.Link,
                publicKey: 'vrf1',
                name: 'vrf',
            },
        ];
        await basicTest(currentLinkedAccounts, toLinkNodeAccounts, 1, false, expectedTransactions);
    });

    it('creates generic transactions when VRF and different Remote', async () => {
        const currentLinkedAccounts: GenericNodeAccount = {
            remote: {
                publicKey: 'remote1',
            },
            vrf: {
                publicKey: 'vrf1',
            },
        };
        const toLinkNodeAccounts: GenericNodeAccount = {
            remote: {
                publicKey: 'remote2',
            },
            vrf: {
                publicKey: 'vrf1',
            },
        };

        const expectedTransactions = [
            { publicKey: 'remote1', action: 0, name: 'remote' },
            { publicKey: 'remote2', action: 1, name: 'remote' },
        ];
        await basicTest(currentLinkedAccounts, toLinkNodeAccounts, 1, false, expectedTransactions);
    });
    it('creates generic transactions when different VRF no remote', async () => {
        const currentLinkedAccounts: GenericNodeAccount = {
            remote: {
                publicKey: 'remote1',
            },
            vrf: {
                publicKey: 'vrf1',
            },
        };
        const toLinkNodeAccounts: GenericNodeAccount = {
            vrf: {
                publicKey: 'vrf2',
            },
        };
        const expectedTransactions = [
            { publicKey: 'vrf1', action: 0, name: 'vrf' },
            { publicKey: 'vrf2', action: 1, name: 'vrf' },
        ];
        await basicTest(currentLinkedAccounts, toLinkNodeAccounts, 1, false, expectedTransactions);
    });

    it('creates generic transactions when new vrf, remote and voting', async () => {
        const currentLinkedAccounts: GenericNodeAccount = {};
        const toLinkNodeAccounts: GenericNodeAccount = {
            vrf: {
                publicKey: 'vrf1',
            },
            remote: {
                publicKey: 'remote1',
            },

            voting: [
                {
                    publicKey: 'V1',
                    startEpoch: 70,
                    endEpoch: 97,
                },
                {
                    publicKey: 'V2',
                    startEpoch: 98,
                    endEpoch: 125,
                },
                {
                    publicKey: 'V3',
                    startEpoch: 126,
                    endEpoch: 153,
                },
                {
                    publicKey: 'V4',
                    startEpoch: 154,
                    endEpoch: 181,
                },
                {
                    publicKey: 'V5',
                    startEpoch: 182,
                    endEpoch: 209,
                },
                {
                    publicKey: 'V6',
                    startEpoch: 210,
                    endEpoch: 237,
                },
                {
                    publicKey: 'V7',
                    startEpoch: 238,
                    endEpoch: 265,
                },
                {
                    publicKey: 'V8',
                    startEpoch: 266,
                    endEpoch: 293,
                },
                {
                    publicKey: 'V9',
                    startEpoch: 294,
                    endEpoch: 321,
                },
                {
                    publicKey: 'V10',
                    startEpoch: 322,
                    endEpoch: 349,
                },
            ],
        };
        const expectedTransactions = [
            { publicKey: 'remote1', action: 1, name: 'remote' },
            { publicKey: 'vrf1', action: 1, name: 'vrf' },
            { publicKey: 'V1', startEpoch: 70, endEpoch: 97, action: 1, name: 'voting' },
            { publicKey: 'V2', startEpoch: 98, endEpoch: 125, action: 1, name: 'voting' },
            { publicKey: 'V3', startEpoch: 126, endEpoch: 153, action: 1, name: 'voting' },
        ];
        await basicTest(currentLinkedAccounts, toLinkNodeAccounts, 1, false, expectedTransactions);
    });

    it('creates generic transactions voting old and different voting', async () => {
        const currentLinkedAccounts: GenericNodeAccount = {
            vrf: {
                publicKey: 'vrf1',
            },
            remote: {
                publicKey: 'remoteOLD',
            },
            voting: [
                {
                    publicKey: 'V1',
                    startEpoch: 70,
                    endEpoch: 97, // remove is old
                },
                {
                    publicKey: 'V2',
                    startEpoch: 98,
                    endEpoch: 125,
                },
                {
                    publicKey: 'V3',
                    startEpoch: 126,
                    endEpoch: 200, // remove is different
                },
            ],
        };
        const toLinkNodeAccounts: GenericNodeAccount = {
            vrf: {
                publicKey: 'vrf1',
            },
            remote: {
                publicKey: 'remote1',
            },

            voting: [
                {
                    publicKey: 'V1',
                    startEpoch: 70,
                    endEpoch: 97,
                },
                {
                    publicKey: 'V2',
                    startEpoch: 98,
                    endEpoch: 125,
                },
                {
                    publicKey: 'V3',
                    startEpoch: 126,
                    endEpoch: 153,
                },
                {
                    publicKey: 'V4',
                    startEpoch: 154,
                    endEpoch: 181,
                },
                {
                    publicKey: 'V5',
                    startEpoch: 182,
                    endEpoch: 209,
                },
                {
                    publicKey: 'V6',
                    startEpoch: 210,
                    endEpoch: 237,
                },
                {
                    publicKey: 'V7',
                    startEpoch: 238,
                    endEpoch: 265,
                },
                {
                    publicKey: 'V8',
                    startEpoch: 266,
                    endEpoch: 293,
                },
                {
                    publicKey: 'V9',
                    startEpoch: 294,
                    endEpoch: 321,
                },
                {
                    publicKey: 'V10',
                    startEpoch: 322,
                    endEpoch: 349,
                },
            ],
        };
        const expectedTransactions = [
            { publicKey: 'remoteOLD', action: 0, name: 'remote' },
            { publicKey: 'remote1', action: 1, name: 'remote' },
            { publicKey: 'V1', startEpoch: 70, endEpoch: 97, action: 0, name: 'voting' },
            { publicKey: 'V3', startEpoch: 126, endEpoch: 200, action: 0, name: 'voting' },
            { publicKey: 'V3', startEpoch: 126, endEpoch: 153, action: 1, name: 'voting' },
            { publicKey: 'V4', startEpoch: 154, endEpoch: 181, action: 1, name: 'voting' },
        ];
        await basicTest(currentLinkedAccounts, toLinkNodeAccounts, 99, false, expectedTransactions);
    });
});
