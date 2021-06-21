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
import 'mocha';
import { it } from 'mocha';
import { BootstrapService, ConfigService, DefaultPrivateKeyResolver, Preset } from 'symbol-bootstrap-core';
import { AccountInfoDTO } from 'symbol-openapi-typescript-fetch-client';
import {
    AccountHttp,
    AccountInfo,
    Deadline,
    LinkAction,
    NodeKeyLinkTransaction,
    Transaction,
    TransactionType,
    UInt64,
    VotingKeyLinkTransaction,
} from 'symbol-sdk';
import { LinkService, LinkServiceTransactionFactoryParams } from '../../src/service';

const password = '1234';
describe('LinkService', () => {
    const alreadyLinkedAccountInfoDto: AccountInfoDTO = {
        account: {
            version: 1,
            address: '98FDAF58576716949328890D535F82C2C7A740F8902A9CED',
            addressHeight: '1',
            publicKey: 'A8443EE1BE131A300D321BAF116E18F6A339BB2FF16C02ED0C4D6C1EB71A648B',
            publicKeyHeight: '1',
            accountType: 1,
            supplementalPublicKeys: {
                linked: {
                    publicKey: '09DA71927DCBB67FD0352CFC16114BE51B87538E0AA8FC64233439E3DBAC87FB',
                },
                node: {
                    publicKey: '5B267BA8A425FB2AE0AD3A4B87D5342A4A5DF938BEEA96E4E437BF12ED9A7C09',
                },
                vrf: {
                    publicKey: 'AEC02D888F268EBDAD038E19BF2EE182E36F207F29BF05ABFC5E20EAF2D4F719',
                },
                voting: {
                    publicKeys: [
                        {
                            publicKey: '01D1CEDA3255CC8FD4E76AA32CDB8C31FA6F2CF752778DBF6E1BAE8F10472DF3',
                            startEpoch: 1,
                            endEpoch: 360,
                        },
                    ],
                },
            },
            activityBuckets: [],
            mosaics: [],
            importance: '3000000',
            importanceHeight: '180',
        },
        id: '60168F146AE03A2FE7139F9B',
    };

    const notLinkedAccountDto: AccountInfoDTO = {
        account: {
            version: 1,
            address: '98FDAF58576716949328890D535F82C2C7A740F8902A9CED',
            addressHeight: '1',
            publicKey: 'A8443EE1BE131A300D321BAF116E18F6A339BB2FF16C02ED0C4D6C1EB71A648B',
            publicKeyHeight: '1',
            accountType: 1,
            supplementalPublicKeys: {},
            activityBuckets: [],
            mosaics: [],
            importance: '3000000',
            importanceHeight: '180',
        },
        id: '60168F146AE03A2FE7139F9B',
    };

    const assertTransaction = (transaction: Transaction, type: TransactionType, action: LinkAction, linkedPublicKey: string): void => {
        expect(transaction.type).eq(type);
        expect((transaction as NodeKeyLinkTransaction).linkAction).eq(action);
        expect((transaction as NodeKeyLinkTransaction).linkedPublicKey).eq(linkedPublicKey);
    };

    const assertVotingTransaction = (
        transaction: Transaction,
        action: LinkAction,
        linkedPublicKey: string,
        startEpoch: number,
        endEpoch: number,
    ): void => {
        expect(transaction.type).eq(TransactionType.VOTING_KEY_LINK);
        expect((transaction as VotingKeyLinkTransaction).linkAction).eq(action);
        expect((transaction as VotingKeyLinkTransaction).linkedPublicKey).eq(linkedPublicKey);
        expect((transaction as VotingKeyLinkTransaction).startEpoch).eq(startEpoch);
        expect((transaction as VotingKeyLinkTransaction).endEpoch).eq(endEpoch);
    };

    it('LinkService testnet when down', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            target: 'target/tests/testnet-dual',
            password,
            reset: false,
            offline: true,
            preset: Preset.testnet,
            assembly: 'dual',
            privateKeyResolver: new DefaultPrivateKeyResolver(),
            customPresetObject: {
                nodeUseRemoteAccount: true,
            },
        };
        try {
            await new BootstrapService().config(params);
            await new LinkService(params).run();
        } catch (e) {
            expect(e.message.indexOf('No up and running node could be found out of:'), e.message).to.be.greaterThan(-1);
            expect(e.message.indexOf('http://localhost:3000'), e.message).to.be.greaterThan(-1);
        }
    });

    it('LinkService create transactions when dual + voting', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            target: 'target/tests/testnet-dual-voting',
            password,
            reset: false,
            offline: true,
            preset: Preset.testnet,
            customPreset: './test/unit-test-profiles/voting_preset.yml',
            customPresetObject: {
                nodeUseRemoteAccount: true,
            },
            assembly: 'dual',
        };
        const { addresses, presetData } = await new BootstrapService().config(params);
        const maxFee = UInt64.fromUint(10);
        const nodeAccount = addresses.nodes![0];
        const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: nodeAccount,
            maxFee: maxFee,
            mainAccountInfo: notLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(3);
        assertTransaction(transactions[0], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
        assertTransaction(transactions[1], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);
        expect(addresses!.nodes![0].voting?.length).eq(1);
        assertVotingTransaction(
            transactions[2],
            LinkAction.Link,
            addresses!.nodes![0].voting![0].publicKey,
            presetData.lastKnownNetworkEpoch,
            presetData.lastKnownNetworkEpoch + presetData.votingKeyDesiredLifetime - 1,
        );
    });

    it('LinkService create transactions when dual + voting + lastKnownNetworkEpoch1', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            target: 'target/tests/testnet-dual-voting-network-1',
            password,
            reset: false,
            offline: true,
            preset: Preset.testnet,
            customPreset: './test/unit-test-profiles/voting_preset.yml',
            customPresetObject: {
                lastKnownNetworkEpoch: 1,
                nodeUseRemoteAccount: true,
            },
            assembly: 'dual',
        };
        const { addresses, presetData } = await new BootstrapService().config(params);
        const maxFee = UInt64.fromUint(10);
        const nodeAccount = addresses.nodes![0];
        const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: nodeAccount,
            maxFee: maxFee,
            mainAccountInfo: notLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(3);
        assertTransaction(transactions[0], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
        assertTransaction(transactions[1], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);
        expect(addresses!.nodes![0].voting?.length).eq(1);
        expect(presetData.lastKnownNetworkEpoch).eq(1);
        expect(presetData.votingKeyDesiredLifetime).eq(720);
        assertVotingTransaction(
            transactions[2],
            LinkAction.Link,
            addresses!.nodes![0].voting![0].publicKey,
            presetData.lastKnownNetworkEpoch,
            presetData.lastKnownNetworkEpoch + presetData.votingKeyDesiredLifetime - 1,
        );
    });

    it('LinkService create transactions when dual + voting + upgrade (manual)', async () => {
        const target = 'target/tests/testnet-dual-voting-upgrade-manual';
        const maxFee = UInt64.fromUint(10);
        {
            const params = {
                ...ConfigService.defaultParams,
                ...LinkService.defaultParams,
                ready: true,
                offline: true,
                target: target,
                password,
                reset: true,
                preset: Preset.testnet,
                customPreset: './test/unit-test-profiles/voting_preset.yml',
                customPresetObject: {
                    nodeUseRemoteAccount: true,
                },
                assembly: 'dual',
            };
            const { addresses, presetData } = await new BootstrapService().config(params);
            const nodeAccount = addresses.nodes![0];
            const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
            const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
                presetData,
                deadline: Deadline.create(1),
                nodeAccount: nodeAccount,
                maxFee: maxFee,
                mainAccountInfo: notLinkedAccountInfo,
            };

            const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
            expect(transactions.length).eq(3);
            assertTransaction(transactions[0], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
            assertTransaction(transactions[1], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);
            expect(addresses!.nodes![0].voting?.length).eq(1);
            assertVotingTransaction(
                transactions[2],
                LinkAction.Link,
                addresses!.nodes![0].voting![0].publicKey,
                presetData.lastKnownNetworkEpoch,
                presetData.lastKnownNetworkEpoch + presetData.votingKeyDesiredLifetime - 1,
            );
        }

        {
            const params = {
                ...ConfigService.defaultParams,
                ...LinkService.defaultParams,
                ready: true,
                target: target,
                password,
                upgrade: true,
                preset: Preset.testnet,
                customPreset: './test/unit-test-profiles/voting_preset.yml',
                customPresetObject: {
                    nodeUseRemoteAccount: true,
                    lastKnownNetworkEpoch: 323 + 720 - 10, //in the future, last known Network Epoch is pretty high!
                },
                assembly: 'dual',
            };
            const { addresses, presetData } = await new BootstrapService().config(params);
            const nodeAccount = addresses.nodes![0];
            const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
            const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
                presetData,
                deadline: Deadline.create(1),
                nodeAccount: nodeAccount,
                maxFee: maxFee,
                mainAccountInfo: notLinkedAccountInfo,
            };
            expect(addresses!.nodes![0].voting?.length).eq(1);
            const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
            expect(transactions.length).eq(2);
            assertTransaction(transactions[0], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
            assertTransaction(transactions[1], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);
        }
    });

    it('LinkService create transactions when dual + voting + upgrade with gap (automatic)', async () => {
        const target = 'target/tests/testnet-dual-voting-upgrade-automatic-gap';
        const maxFee = UInt64.fromUint(10);
        let originalLasKnownNetworkEpoch: number;
        {
            const params = {
                ...ConfigService.defaultParams,
                ...LinkService.defaultParams,
                ready: true,
                offline: true,
                target: target,
                password,
                reset: true,
                preset: Preset.testnet,
                customPreset: './test/unit-test-profiles/voting_preset.yml',
                customPresetObject: {
                    autoUpdateVotingKeys: true,
                    nodeUseRemoteAccount: true,
                },
                assembly: 'dual',
            };
            const { addresses, presetData } = await new BootstrapService().config(params);
            const nodeAccount = addresses.nodes![0];
            const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
            const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
                presetData,
                deadline: Deadline.create(1),
                nodeAccount: nodeAccount,
                maxFee: maxFee,
                mainAccountInfo: notLinkedAccountInfo,
            };

            const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
            expect(transactions.length).eq(3);
            assertTransaction(transactions[0], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
            assertTransaction(transactions[1], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);
            expect(addresses!.nodes![0].voting?.length).eq(1);
            originalLasKnownNetworkEpoch = presetData.lastKnownNetworkEpoch;
            assertVotingTransaction(
                transactions[2],
                LinkAction.Link,
                addresses!.nodes![0].voting![0].publicKey,
                presetData.lastKnownNetworkEpoch,
                presetData.lastKnownNetworkEpoch + presetData.votingKeyDesiredLifetime - 1,
            );
        }

        {
            const lastKnownNetworkEpoch = 323 + 720 - 10;
            const params = {
                ...ConfigService.defaultParams,
                ...LinkService.defaultParams,
                ready: true,
                target: target,
                password,
                upgrade: true,
                offline: true,
                preset: Preset.testnet,
                customPreset: './test/unit-test-profiles/voting_preset.yml',
                customPresetObject: {
                    nodeUseRemoteAccount: true,
                    autoUpdateVotingKeys: true,
                    lastKnownNetworkEpoch: lastKnownNetworkEpoch, //in the future, last known Network Epoch is pretty high!
                },
                assembly: 'dual',
            };
            const { addresses, presetData } = await new BootstrapService().config(params);
            const nodeAccount = addresses.nodes![0];
            const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
            const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
                presetData,
                deadline: Deadline.create(1),
                nodeAccount: nodeAccount,
                maxFee: maxFee,
                mainAccountInfo: notLinkedAccountInfo,
            };
            expect(addresses!.nodes![0].voting?.length).eq(2);
            const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
            expect(transactions.length).eq(3);
            assertTransaction(transactions[0], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
            assertTransaction(transactions[1], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);

            expect(lastKnownNetworkEpoch).gt(originalLasKnownNetworkEpoch + presetData.votingKeyDesiredLifetime);
            console.log(lastKnownNetworkEpoch);
            assertVotingTransaction(
                transactions[2],
                LinkAction.Link,
                addresses!.nodes![0].voting![1].publicKey,
                lastKnownNetworkEpoch,
                lastKnownNetworkEpoch + presetData.votingKeyDesiredLifetime - 1,
            );
        }
    });

    it('LinkService create transactions when dual + voting + upgrade continue (automatic)', async () => {
        const target = 'target/tests/testnet-dual-voting-upgrade-automatic-continue';
        const maxFee = UInt64.fromUint(10);
        let originalLasKnownNetworkEpoch: number;
        {
            const params = {
                ...ConfigService.defaultParams,
                ...LinkService.defaultParams,
                ready: true,
                offline: true,
                target: target,
                password,
                reset: true,
                preset: Preset.testnet,
                customPreset: './test/unit-test-profiles/voting_preset.yml',
                customPresetObject: {
                    lastKnownNetworkEpoch: 235,
                    autoUpdateVotingKeys: true,
                    nodeUseRemoteAccount: true,
                },
                assembly: 'dual',
            };
            const { addresses, presetData } = await new BootstrapService().config(params);
            const nodeAccount = addresses.nodes![0];
            const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
            const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
                presetData,
                deadline: Deadline.create(1),
                nodeAccount: nodeAccount,
                maxFee: maxFee,
                mainAccountInfo: notLinkedAccountInfo,
            };

            const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
            expect(transactions.length).eq(3);
            assertTransaction(transactions[0], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
            assertTransaction(transactions[1], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);
            expect(addresses!.nodes![0].voting?.length).eq(1);
            originalLasKnownNetworkEpoch = presetData.lastKnownNetworkEpoch;
            assertVotingTransaction(
                transactions[2],
                LinkAction.Link,
                addresses!.nodes![0].voting![0].publicKey,
                presetData.lastKnownNetworkEpoch,
                presetData.lastKnownNetworkEpoch + presetData.votingKeyDesiredLifetime - 1,
            );
        }

        {
            // in the future, but before current files expires.
            const lastKnownNetworkEpoch = 917 - 10;
            const params = {
                ...ConfigService.defaultParams,
                ...LinkService.defaultParams,
                ready: true,
                target: target,
                password,
                upgrade: true,
                offline: true,
                preset: Preset.testnet,
                customPreset: './test/unit-test-profiles/voting_preset.yml',
                customPresetObject: {
                    nodeUseRemoteAccount: true,
                    autoUpdateVotingKeys: true,
                    lastKnownNetworkEpoch: lastKnownNetworkEpoch, //in the future, last known Network Epoch is pretty high!
                },
                assembly: 'dual',
            };
            const { addresses, presetData } = await new BootstrapService().config(params);
            const nodeAccount = addresses.nodes![0];
            const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
            const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
                presetData,
                deadline: Deadline.create(1),
                nodeAccount: nodeAccount,
                maxFee: maxFee,
                mainAccountInfo: notLinkedAccountInfo,
            };
            expect(addresses!.nodes![0].voting?.length).eq(2);
            const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
            // The original link needs to still be linked as it's current!
            expect(transactions.length).eq(4);
            assertTransaction(transactions[0], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
            assertTransaction(transactions[1], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);
            expect(lastKnownNetworkEpoch).lt(originalLasKnownNetworkEpoch + presetData.votingKeyDesiredLifetime);
            console.log(lastKnownNetworkEpoch);
            assertVotingTransaction(
                transactions[2],
                LinkAction.Link,
                addresses!.nodes![0].voting![0].publicKey,
                originalLasKnownNetworkEpoch,
                originalLasKnownNetworkEpoch + presetData.votingKeyDesiredLifetime - 1,
            );
            assertVotingTransaction(
                transactions[3],
                LinkAction.Link,
                addresses!.nodes![0].voting![1].publicKey,
                originalLasKnownNetworkEpoch + presetData.votingKeyDesiredLifetime,
                originalLasKnownNetworkEpoch + presetData.votingKeyDesiredLifetime + presetData.votingKeyDesiredLifetime - 1,
            );
        }
    });

    it('LinkService create transactions when dual + voting and already linked (different voting key)', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            offline: true,
            target: 'target/tests/testnet-dual-voting',
            password,
            reset: false,
            preset: Preset.testnet,
            customPreset: './test/unit-test-profiles/voting_preset.yml',
            customPresetObject: {
                nodeUseRemoteAccount: true,
            },
            assembly: 'dual',
        };
        const { addresses, presetData } = await new BootstrapService().config(params);
        const maxFee = UInt64.fromUint(10);
        const nodeAccount = addresses.nodes![0];
        const alreadyLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](alreadyLinkedAccountInfoDto);
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: nodeAccount,
            maxFee: maxFee,
            mainAccountInfo: alreadyLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(6);

        assertTransaction(
            transactions[0],
            TransactionType.ACCOUNT_KEY_LINK,
            LinkAction.Unlink,
            alreadyLinkedAccountInfo.supplementalPublicKeys.linked!.publicKey,
        );

        assertTransaction(
            transactions[1],
            TransactionType.VRF_KEY_LINK,
            LinkAction.Unlink,
            alreadyLinkedAccountInfo.supplementalPublicKeys.vrf!.publicKey,
        );

        assertVotingTransaction(
            transactions[2],
            LinkAction.Unlink,
            alreadyLinkedAccountInfoDto?.account.supplementalPublicKeys.voting!.publicKeys[0].publicKey,
            1,
            360,
        );
        assertTransaction(transactions[3], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
        assertTransaction(transactions[4], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);

        assertVotingTransaction(
            transactions[5],
            LinkAction.Link,
            addresses!.nodes![0].voting![0].publicKey,
            presetData.lastKnownNetworkEpoch,
            presetData.lastKnownNetworkEpoch + presetData.votingKeyDesiredLifetime - 1,
        );

        expect(addresses!.nodes![0].voting?.length).eq(1);
    });

    it('LinkService create transactions when dual + voting and already linked (same voting key)', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            offline: true,
            target: 'target/tests/testnet-dual-voting',
            password,
            reset: false,
            preset: Preset.testnet,
            customPreset: './test/unit-test-profiles/voting_preset.yml',
            customPresetObject: {
                nodeUseRemoteAccount: true,
            },
            assembly: 'dual',
        };
        const { addresses, presetData } = await new BootstrapService().config(params);
        const alreadyLinkedAccountInfoDto: AccountInfoDTO = {
            account: {
                version: 1,
                address: '98FDAF58576716949328890D535F82C2C7A740F8902A9CED',
                addressHeight: '1',
                publicKey: 'A8443EE1BE131A300D321BAF116E18F6A339BB2FF16C02ED0C4D6C1EB71A648B',
                publicKeyHeight: '1',
                accountType: 1,
                supplementalPublicKeys: {
                    linked: {
                        publicKey: '09DA71927DCBB67FD0352CFC16114BE51B87538E0AA8FC64233439E3DBAC87FB',
                    },
                    node: {
                        publicKey: '5B267BA8A425FB2AE0AD3A4B87D5342A4A5DF938BEEA96E4E437BF12ED9A7C09',
                    },
                    vrf: {
                        publicKey: 'AEC02D888F268EBDAD038E19BF2EE182E36F207F29BF05ABFC5E20EAF2D4F719',
                    },
                    voting: {
                        publicKeys: [addresses!.nodes![0].voting![0]],
                    },
                },
                activityBuckets: [],
                mosaics: [],
                importance: '3000000',
                importanceHeight: '180',
            },
            id: '60168F146AE03A2FE7139F9B',
        };
        const alreadyLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](alreadyLinkedAccountInfoDto);
        const maxFee = UInt64.fromUint(10);
        const nodeAccount = addresses.nodes![0];
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: nodeAccount,
            maxFee: maxFee,
            mainAccountInfo: alreadyLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(4);

        assertTransaction(
            transactions[0],
            TransactionType.ACCOUNT_KEY_LINK,
            LinkAction.Unlink,
            alreadyLinkedAccountInfo.supplementalPublicKeys.linked!.publicKey,
        );
        assertTransaction(
            transactions[1],
            TransactionType.VRF_KEY_LINK,
            LinkAction.Unlink,
            alreadyLinkedAccountInfo.supplementalPublicKeys.vrf!.publicKey,
        );
        assertTransaction(transactions[2], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);

        assertTransaction(transactions[3], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);
    });

    it('LinkService create transactions when dual + voting and already linked (different epoch key)', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            offline: true,
            target: 'target/tests/testnet-dual-voting',
            password,
            reset: false,
            preset: Preset.testnet,
            customPreset: './test/unit-test-profiles/voting_preset.yml',
            customPresetObject: {
                nodeUseRemoteAccount: true,
            },
            assembly: 'dual',
        };
        const { addresses, presetData } = await new BootstrapService().config(params);
        const alreadyLinkedAccountInfoDto: AccountInfoDTO = {
            account: {
                version: 1,
                address: '98FDAF58576716949328890D535F82C2C7A740F8902A9CED',
                addressHeight: '1',
                publicKey: 'A8443EE1BE131A300D321BAF116E18F6A339BB2FF16C02ED0C4D6C1EB71A648B',
                publicKeyHeight: '1',
                accountType: 1,
                supplementalPublicKeys: {
                    linked: {
                        publicKey: '09DA71927DCBB67FD0352CFC16114BE51B87538E0AA8FC64233439E3DBAC87FB',
                    },
                    node: {
                        publicKey: '5B267BA8A425FB2AE0AD3A4B87D5342A4A5DF938BEEA96E4E437BF12ED9A7C09',
                    },
                    vrf: {
                        publicKey: 'AEC02D888F268EBDAD038E19BF2EE182E36F207F29BF05ABFC5E20EAF2D4F719',
                    },
                    voting: {
                        publicKeys: [{ ...addresses!.nodes![0].voting![0], startEpoch: 400, endEpoch: 500 }],
                    },
                },
                activityBuckets: [],
                mosaics: [],
                importance: '3000000',
                importanceHeight: '180',
            },
            id: '60168F146AE03A2FE7139F9B',
        };
        const alreadyLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](alreadyLinkedAccountInfoDto);
        const maxFee = UInt64.fromUint(10);
        const nodeAccount = addresses.nodes![0];
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: nodeAccount,
            maxFee: maxFee,
            mainAccountInfo: alreadyLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(6);

        assertTransaction(
            transactions[0],
            TransactionType.ACCOUNT_KEY_LINK,
            LinkAction.Unlink,
            alreadyLinkedAccountInfo.supplementalPublicKeys.linked!.publicKey,
        );

        assertTransaction(
            transactions[1],
            TransactionType.VRF_KEY_LINK,
            LinkAction.Unlink,
            alreadyLinkedAccountInfo.supplementalPublicKeys.vrf!.publicKey,
        );
        assertVotingTransaction(
            transactions[2],
            LinkAction.Unlink,
            alreadyLinkedAccountInfoDto?.account.supplementalPublicKeys.voting!.publicKeys[0].publicKey,
            400,
            500,
        );
        assertTransaction(transactions[3], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
        assertTransaction(transactions[4], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);

        assertVotingTransaction(
            transactions[5],
            LinkAction.Link,
            nodeAccount.voting![0].publicKey,
            presetData.lastKnownNetworkEpoch,
            presetData.lastKnownNetworkEpoch + presetData.votingKeyDesiredLifetime - 1,
        );
    });

    it('LinkService create transactions when dual + voting and already linked not removed', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            offline: true,
            target: 'target/tests/testnet-dual-voting',
            password,
            reset: false,
            preset: Preset.testnet,
            customPreset: './test/unit-test-profiles/voting_preset.yml',
            customPresetObject: {
                nodeUseRemoteAccount: true,
            },
            assembly: 'dual',
            removeOldLinked: false,
        };
        const alreadyLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](alreadyLinkedAccountInfoDto);
        const { addresses, presetData } = await new BootstrapService().config(params);
        const maxFee = UInt64.fromUint(10);
        const nodeAccount = addresses.nodes![0];
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: nodeAccount,
            maxFee: maxFee,
            mainAccountInfo: alreadyLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(0);
    });

    it('LinkService create transactions when dual', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            target: 'target/tests/testnet-dual',
            password,
            reset: true,
            offline: true,
            preset: Preset.testnet,
            customPresetObject: {
                nodeUseRemoteAccount: true,
            },
            assembly: 'dual',
        };
        const { addresses, presetData } = await new BootstrapService().config(params);
        const maxFee = UInt64.fromUint(10);
        const nodeAccount = addresses.nodes![0];
        const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: nodeAccount,
            maxFee: maxFee,
            mainAccountInfo: notLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(2);
        assertTransaction(transactions[0], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
        assertTransaction(transactions[1], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);
    });

    it('LinkService create transactions when dual already linked', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            target: 'target/tests/testnet-dual',
            password,
            reset: true,
            offline: true,
            preset: Preset.testnet,
            customPresetObject: {
                nodeUseRemoteAccount: true,
            },
            assembly: 'dual',
        };
        const { addresses, presetData } = await new BootstrapService().config(params);
        const maxFee = UInt64.fromUint(10);
        const nodeAccount = addresses.nodes![0];
        const alreadyLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](alreadyLinkedAccountInfoDto);
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: nodeAccount,
            maxFee: maxFee,
            mainAccountInfo: alreadyLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(4);
        assertTransaction(
            transactions[0],
            TransactionType.ACCOUNT_KEY_LINK,
            LinkAction.Unlink,
            alreadyLinkedAccountInfo.supplementalPublicKeys.linked!.publicKey,
        );
        assertTransaction(
            transactions[1],
            TransactionType.VRF_KEY_LINK,
            LinkAction.Unlink,
            alreadyLinkedAccountInfo.supplementalPublicKeys.vrf!.publicKey,
        );
        assertTransaction(transactions[2], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
        assertTransaction(transactions[3], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);
    });

    it('LinkService create transactions when dual already linked not removing', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            target: 'target/tests/testnet-dual',
            password,
            reset: true,
            offline: true,
            preset: Preset.testnet,
            customPresetObject: {
                nodeUseRemoteAccount: true,
            },
            assembly: 'dual',
            removeOldLinked: false,
        };
        const alreadyLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](alreadyLinkedAccountInfoDto);
        const { addresses, presetData } = await new BootstrapService().config(params);
        const maxFee = UInt64.fromUint(10);
        const nodeAccount = addresses.nodes![0];
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: nodeAccount,
            maxFee: maxFee,
            mainAccountInfo: alreadyLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(0);
    });

    it('LinkService create transactions when dual not using remote account', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            target: 'target/tests/testnet-dual-not-remote',
            password,
            reset: false,
            preset: Preset.testnet,
            customPresetObject: {
                nodeUseRemoteAccount: false,
            },
            assembly: 'dual',
        };

        const { addresses, presetData } = await new BootstrapService().config(params);
        const maxFee = UInt64.fromUint(10);
        const nodeAccount = addresses.nodes![0];
        const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: nodeAccount,
            maxFee: maxFee,
            mainAccountInfo: notLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(1);
        assertTransaction(transactions[0], TransactionType.VRF_KEY_LINK, LinkAction.Link, nodeAccount.vrf!.publicKey);
    });

    it('LinkService create transactions when api', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            target: 'target/tests/testnet-api',
            password,
            reset: false,
            preset: Preset.testnet,
            customPresetObject: {
                nodeUseRemoteAccount: true,
            },
            assembly: 'api',
        };
        const { addresses, presetData } = await new BootstrapService().config(params);
        const maxFee = UInt64.fromUint(10);

        const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: addresses.nodes![0],
            maxFee: maxFee,
            mainAccountInfo: notLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(0);
    });

    it('LinkService create transactions when api and voting', async () => {
        const params = {
            ...ConfigService.defaultParams,
            ...LinkService.defaultParams,
            ready: true,
            offline: true,
            target: 'target/tests/testnet-api-voting',
            password,
            reset: true,
            preset: Preset.testnet,
            customPreset: './test/unit-test-profiles/voting_preset.yml',
            customPresetObject: {
                nodeUseRemoteAccount: true,
            },
            assembly: 'api',
        };
        const { addresses, presetData } = await new BootstrapService().config(params);
        const maxFee = UInt64.fromUint(10);
        const nodeAccount = addresses.nodes![0];
        const notLinkedAccountInfo: AccountInfo = (AccountHttp as any)['toAccountInfo'](notLinkedAccountDto);
        const transactionFactoryParams: LinkServiceTransactionFactoryParams = {
            presetData,
            deadline: Deadline.create(1),
            nodeAccount: nodeAccount,
            maxFee: maxFee,
            mainAccountInfo: notLinkedAccountInfo,
        };

        const transactions = await new LinkService(params).createTransactions(transactionFactoryParams);
        expect(transactions.length).eq(2);
        assertTransaction(transactions[0], TransactionType.ACCOUNT_KEY_LINK, LinkAction.Link, nodeAccount.remote!.publicKey);
        assertVotingTransaction(
            transactions[1],
            LinkAction.Link,
            nodeAccount.voting![0].publicKey,
            presetData.lastKnownNetworkEpoch,
            presetData.lastKnownNetworkEpoch + presetData.votingKeyDesiredLifetime - 1,
        );
    });
});
