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

import { map, toArray } from 'rxjs/operators';
import {
    Account,
    AccountKeyLinkTransaction,
    AggregateTransaction,
    CosignatureTransaction,
    Deadline,
    LinkAction,
    MultisigAccountModificationTransaction,
    RawMessage,
    RepositoryFactoryHttp,
    TransactionGroup,
    TransactionService,
    TransferTransaction,
    UInt64,
} from 'symbol-sdk';
import { BootstrapUtils } from '../../src/service';

// const url = 'http://localhost:3000';
// const multisigPrivateKey = '96258E6EDBFA77D4138A56D03A7A38B89F1BC7721B532B91A43704AE87BBCC87';
// const cosignatory1PrivateKey = 'B1AA7A73D3FCB6054BC7A968C289EFDAF57BCBDC1756E0F3F58696C03F201BFD';
// const cosignatory2PrivateKey = 'AECAA68E6C12C88D28067612AA71B70AA9DA9549CEB3B54D897B711A63E93B71';
// const cosignatory3PrivateKey = '2515356696EB926299ACD3BA872A404BB6D8AD35F9F86015F280858D60C16600';

const url = 'http://api-01.ap-northeast-1.testnet.symboldev.network:3000';
const multisigPrivateKey = 'CA82E7ADAF7AB729A5462A1BD5AA78632390634904A64EB1BB22295E2E1A1BDD';
const cosignatory1PrivateKey = 'AAAAB232742BB4AB3A1368BD4615E4E6D0224AB71A016BAF8520A332C9778737';
const cosignatory2PrivateKey = 'BBBEE976890916E54FA825D26BDD0235F5EB5B6A143C199AB0AE5EE9328E08CE';
const cosignatory3PrivateKey = 'CCCEE976890916E54FA825D26BDD0235F5EB5B6A143C199AB0AE5EE9328E08EE';

const example = async () => {
    const repositoryFactory = new RepositoryFactoryHttp(url);
    const listener = repositoryFactory.createListener();
    const networkType = await repositoryFactory.getNetworkType().toPromise();
    const epochAdjustment = await repositoryFactory.getEpochAdjustment().toPromise();
    const networkGenerationHash = await repositoryFactory.getGenerationHash().toPromise();
    const currency = (await repositoryFactory.getCurrencies().toPromise()).currency;
    const deadline = Deadline.create(epochAdjustment);
    const maxFee = UInt64.fromUint(2000000);
    const service = new TransactionService(repositoryFactory.createTransactionRepository(), repositoryFactory.createReceiptRepository());

    const multisig = Account.createFromPrivateKey(multisigPrivateKey, networkType);
    console.log(`Mutlsig: ${multisig.address.plain()}`);

    // replace with cosignatory 1 public key
    const cosignatory1 = Account.createFromPrivateKey(cosignatory1PrivateKey, networkType);
    console.log(`cosignatory1 ${cosignatory1.address.plain()}`);

    // replace with cosignatory 2 public key
    const cosignatory2 = Account.createFromPrivateKey(cosignatory2PrivateKey, networkType);
    console.log(`cosignatory2 ${cosignatory2.address.plain()}`);

    // replace with cosignatory 2 public key
    const cosignatory3 = Account.createFromPrivateKey(cosignatory3PrivateKey, networkType);
    console.log(`cosignatory3 ${cosignatory3.address.plain()}`);

    const sendModification = async () => {
        const multisigAccountModificationTransaction = MultisigAccountModificationTransaction.create(
            deadline,
            2,
            2,
            [cosignatory1.address, cosignatory2.address, cosignatory3.address],
            [],
            networkType,
        );

        const aggregateTransaction = AggregateTransaction.createComplete(
            deadline,
            [multisigAccountModificationTransaction.toAggregate(multisig.publicAccount)],
            networkType,
            [],
            maxFee,
        );

        const signedTransaction = multisig.signTransactionWithCosignatories(
            aggregateTransaction,
            [cosignatory1, cosignatory2, cosignatory3],
            networkGenerationHash,
        );
        await service.announce(signedTransaction, listener).toPromise();
        return signedTransaction;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sendTransfer = async () => {
        const transferTransaction = TransferTransaction.create(
            deadline,
            cosignatory1.address,
            [currency.createAbsolute(1)],
            new RawMessage(),
            networkType,
            maxFee,
        );

        const aggregateTransaction = AggregateTransaction.createComplete(
            deadline,
            [transferTransaction.toAggregate(multisig.publicAccount)],
            networkType,
            [],
            maxFee,
        );

        const signedTransaction = cosignatory1.signTransactionWithCosignatories(
            aggregateTransaction,
            [cosignatory2, cosignatory3],
            networkGenerationHash,
        );
        await service.announce(signedTransaction, listener).toPromise();
        return signedTransaction;
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sendUnlink = async () => {
        const transferTransaction = AccountKeyLinkTransaction.create(
            deadline,
            '68691D068EFDDF1F9505CF978B65D83006E8ADC45E06453E04126EBB1A3767A2',
            LinkAction.Unlink,
            networkType,
            maxFee,
        );

        const aggregateTransaction = AggregateTransaction.createComplete(
            deadline,
            [transferTransaction.toAggregate(multisig.publicAccount)],
            networkType,
            [],
            maxFee,
        );

        const signedTransaction = cosignatory1.signTransactionWithCosignatories(
            aggregateTransaction,
            [cosignatory2, cosignatory3],
            networkGenerationHash,
        );
        await service.announce(signedTransaction, listener).toPromise();
        return signedTransaction;
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sendTransferSimple = async () => {
        const transferTransaction = TransferTransaction.create(
            deadline,
            cosignatory1.address,
            [currency.createAbsolute(1)],
            new RawMessage(),
            networkType,
            maxFee,
        );

        const signedTransaction = cosignatory2.sign(transferTransaction, networkGenerationHash);
        await service.announce(signedTransaction, listener).toPromise();

        return signedTransaction;
    };

    const sendCosignature = async () => {
        listener.cosignatureAdded(multisig.address).subscribe((c) => {
            console.log('cosignatureAdded', c);
        });
        listener.confirmed(multisig.address).subscribe((c) => {
            console.log('confirmed', c);
        });
        listener.status(multisig.address).subscribe((c) => {
            console.log('status', c);
        });
        const transactionRepository = repositoryFactory.createTransactionRepository();
        const transactions = await transactionRepository
            .streamer()
            .search({ group: TransactionGroup.Partial, address: multisig.address })
            .pipe(
                map((t) => t as AggregateTransaction),
                toArray(),
            )
            .toPromise();
        for (const transaction of transactions) {
            console.log(`Cosigning ${transaction.transactionInfo?.hash}`);
            const cosignatureTransaction = cosignatory2.signCosignatureTransaction(CosignatureTransaction.create(transaction));
            await transactionRepository.announceAggregateBondedCosignature(cosignatureTransaction).toPromise();

            await repositoryFactory
                .createTransactionStatusRepository()
                .getTransactionStatus(transaction.transactionInfo?.hash || '')
                .toPromise();
        }
        await BootstrapUtils.sleep(10000);
    };

    try {
        await listener.open();
        try {
            await repositoryFactory.createMultisigRepository().getMultisigAccountInfo(multisig.address).toPromise();
            console.log('Is Multisig');
        } catch (e) {
            console.log('No Multisig yet');
            await sendModification();
        }
        await sendCosignature();
    } catch (e) {
        console.log(e);
    } finally {
        listener.close();
    }
};

example().then(() => {
    console.log('finish!');
});
