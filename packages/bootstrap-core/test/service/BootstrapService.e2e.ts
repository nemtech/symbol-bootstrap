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
import { Account, Deadline, PlainMessage, RepositoryFactoryHttp, TransactionService, TransferTransaction, UInt64 } from 'symbol-sdk';
import { BootstrapService, BootstrapUtils, ConfigLoader, ConfigResult, ConfigService, Preset, StartParams } from '../../src/service';

describe('BootstrapService', () => {
    const timeout = 60000;

    //TODO Fix the transfer test!
    async function transferTest(configResult: ConfigResult): Promise<void> {
        const repositoryFactory = new RepositoryFactoryHttp('http://localhost:3000');
        const networkType = await repositoryFactory.getNetworkType().toPromise();
        const generationHash = await repositoryFactory.getGenerationHash().toPromise();

        const nemesisAccounts = configResult.addresses?.mosaics?.[0].accounts.map((n) => n.privateKey);
        if (!nemesisAccounts || !nemesisAccounts[0]) {
            throw new Error('Nemesis accounts could not be loaded!');
        }
        const account = Account.createFromPrivateKey(nemesisAccounts[0], networkType);

        const listener = repositoryFactory.createListener();
        try {
            await listener.open();
            const transactionService = new TransactionService(
                repositoryFactory.createTransactionRepository(),
                repositoryFactory.createReceiptRepository(),
            );
            const { currency } = await repositoryFactory.getCurrencies().toPromise();
            const mosaic = currency.createRelative(10);

            const maxFee = UInt64.fromUint(10000000);

            const recipient = Account.generateNewAccount(networkType);

            const epochAdjustment = await repositoryFactory.getEpochAdjustment().toPromise();
            const transferTransaction = TransferTransaction.create(
                Deadline.create(epochAdjustment),
                recipient.address,
                [mosaic],
                PlainMessage.create('test-message'),
                networkType,
                maxFee,
            );
            await BootstrapUtils.sleep(100);
            const signedTransaction = account.sign(transferTransaction, generationHash);
            console.log(`Announcing transaction hash http://localhost:3000/transactions/unconfirmed/${signedTransaction.hash}`);
            const announcedTransaction = await transactionService.announce(signedTransaction, listener).toPromise();
            console.log('Confirmed!!!');
            expect(announcedTransaction.signer?.address.plain()).eq(account.publicAccount.address.plain());
        } finally {
            if (listener.isOpen()) {
                await listener.close();
            }
        }
    }
    async function basicTestNetwork(configResult: ConfigResult): Promise<void> {
        const repositoryFactory = new RepositoryFactoryHttp('http://localhost:3000');
        const networkType = await repositoryFactory.getNetworkType().toPromise();
        const generationHash = await repositoryFactory.getGenerationHash().toPromise();
        expect(configResult.presetData).not.null;
        expect(configResult.addresses).not.null;
        expect(configResult.addresses.networkType).eq(networkType);
        expect(configResult.presetData.networkType).eq(networkType);
        expect(configResult.addresses.nemesisGenerationHashSeed).eq(generationHash);
        expect(configResult.presetData.nemesisGenerationHashSeed).eq(generationHash);
    }

    it('bootstrap start', async () => {
        const service = new BootstrapService();
        const config: StartParams = {
            ...ConfigService.defaultParams,
            preset: Preset.dualCurrency,
            reset: true,
            timeout,
            pullImages: true,
            healthCheck: true,
            target: 'target/tests/bootstrap-test',
            detached: true,
            user: BootstrapUtils.CURRENT_USER,
        };
        await service.stop(config);
        const configResult = await service.start(config);
        try {
            await basicTestNetwork(configResult);
        } finally {
            await service.stop(config);
        }
    });

    it('bootstrap light', async () => {
        const service = new BootstrapService();
        const config: StartParams = {
            ...ConfigService.defaultParams,
            preset: Preset.dualCurrency,
            assembly: 'light',
            reset: true,
            timeout,
            healthCheck: true,
            pullImages: true,
            target: 'target/tests/light-test',
            detached: true,
            user: BootstrapUtils.CURRENT_USER,
        };
        try {
            await service.stop(config);
            const configResult = await service.start(config);
            await basicTestNetwork(configResult);
        } finally {
            await service.stop(config);
        }
    });

    it('testnet dual', async () => {
        const service = new BootstrapService();
        const config: StartParams = {
            ...ConfigService.defaultParams,
            preset: Preset.testnet,
            assembly: 'dual',
            reset: true,
            timeout,
            healthCheck: true,
            pullImages: true,
            target: 'target/tests/testnet-dual',
            detached: true,
            user: BootstrapUtils.CURRENT_USER,
        };
        try {
            await service.stop(config);
            const configResult = await service.start(config);
            await basicTestNetwork(configResult);
        } finally {
            await service.stop(config);
        }
    });

    it('mainnet dual', async () => {
        const service = new BootstrapService();
        const config: StartParams = {
            ...ConfigService.defaultParams,
            preset: Preset.mainnet,
            assembly: 'dual',
            reset: true,
            timeout,
            healthCheck: true,
            pullImages: true,
            target: 'target/tests/mainnet-dual',
            detached: true,
            user: BootstrapUtils.CURRENT_USER,
        };
        try {
            await service.stop(config);
            const configResult = await service.start(config);
            await basicTestNetwork(configResult);
        } finally {
            await service.stop(config);
        }
    });

    // For some reason transfer test works in this test.
    it.skip('Basic Test Running Network', async () => {
        const loader = new ConfigLoader();
        const target = 'target/tests/bootstrap-test';
        const presetData = loader.loadExistingPresetData(target, false);
        const addresses = loader.loadExistingAddresses(target, false);
        // Here you can write unit tests against a localhost:3000 network
        const configResult = { presetData, addresses };
        await basicTestNetwork(configResult);
        await transferTest(configResult);
    });
});
