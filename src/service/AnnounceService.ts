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
import { flags } from '@oclif/command';
import { prompt } from 'inquirer';
import {
    Account,
    AccountInfo,
    Address,
    AggregateTransaction,
    ChainInfo,
    Convert,
    Deadline,
    LockFundsTransaction,
    MosaicId,
    MultisigAccountInfo,
    NetworkType,
    PublicAccount,
    RepositoryFactory,
    RepositoryFactoryHttp,
    SignedTransaction,
    Transaction,
    TransactionService,
    UInt64,
} from 'symbol-sdk';
import { LogType } from '../logger';
import Logger from '../logger/Logger';
import LoggerFactory from '../logger/LoggerFactory';
import { Addresses, ConfigPreset, NodeAccount, NodePreset } from '../model';
import { CommandUtils } from './CommandUtils';
import { KeyName } from './ConfigService';

const logger: Logger = LoggerFactory.getLogger(LogType.System);

export interface TransactionFactoryParams {
    presetData: ConfigPreset;
    nodePreset: NodePreset;
    nodeAccount: NodeAccount;
    mainAccountInfo: AccountInfo;
    mainAccount: PublicAccount;
    deadline: Deadline;
    maxFee: UInt64;
}

export interface TransactionFactory {
    createTransactions(params: TransactionFactoryParams): Promise<Transaction[]>;
}

export interface RepositoryInfo {
    repositoryFactory: RepositoryFactory;
    restGatewayUrl: string;
    generationHash?: string;
    chainInfo?: ChainInfo;
}

export class AnnounceService {
    private static onProcessListener = () => {
        process.on('SIGINT', () => {
            process.exit(400);
        });
    };
    public static flags = {
        password: CommandUtils.passwordFlag,
        noPassword: CommandUtils.noPasswordFlag,
        url: flags.string({
            char: 'u',
            description: 'the network url',
            default: 'http://localhost:3000',
        }),
        useKnownRestGateways: flags.boolean({
            description:
                'Use the best NEM node available when announcing. Otherwise the command will use the node provided by the --url parameter.',
        }),

        ready: flags.boolean({
            description: 'If --ready is provided, the command will not ask for confirmation when announcing transactions.',
        }),
        maxFee: flags.integer({
            description: `The max fee used when announcing (absolute). The network 'announceDefaultMaxFee' will be used (0.1 XYMs/Coins).`,
        }),
    };
    public async announce(
        providedUrl: string,
        providedMaxFee: number | undefined,
        useKnownRestGateways: boolean,
        ready: boolean | undefined,
        presetData: ConfigPreset,
        addresses: Addresses,
        transactionFactory: TransactionFactory,
        tokenAmount = 'some',
    ): Promise<void> {
        AnnounceService.onProcessListener();
        if (!presetData.nodes || !presetData.nodes?.length) {
            logger.info(`There are no transactions to announce...`);
            return;
        }

        const url = providedUrl.replace(/\/$/, '');
        let repositoryFactory: RepositoryFactory;
        const urls = (useKnownRestGateways && presetData.knownRestGateways) || [];
        if (urls.length) {
            const repositoryInfo = this.sortByHeight(await this.getKnownNodeRepositoryInfos(urls))[0];
            if (!repositoryInfo) {
                throw new Error(`No up and running node could be found of out: ${urls.join(', ')}`);
            }
            repositoryFactory = repositoryInfo.repositoryFactory;
            logger.info(`Connecting to node ${repositoryInfo.restGatewayUrl}`);
        } else {
            repositoryFactory = new RepositoryFactoryHttp(url);
            logger.info(`Connecting to node ${url}`);
        }

        const networkType = await repositoryFactory.getNetworkType().toPromise();
        const transactionRepository = repositoryFactory.createTransactionRepository();
        const transactionService = new TransactionService(transactionRepository, repositoryFactory.createReceiptRepository());
        const epochAdjustment = await repositoryFactory.getEpochAdjustment().toPromise();
        const listener = repositoryFactory.createListener();
        await listener.open();
        const faucetUrl = presetData.faucetUrl;
        const currency = (await repositoryFactory.getCurrencies().toPromise()).currency;
        const currencyMosaicId = currency.mosaicId;
        const deadline = Deadline.create(epochAdjustment);
        const maxFee = UInt64.fromUint(providedMaxFee || presetData.announceDefaultMaxFee || 100000);
        logger.info(`MaxFee is ${maxFee.compact() / Math.pow(10, currency.divisibility)}`);

        const generationHash = await repositoryFactory.getGenerationHash().toPromise();
        if (generationHash?.toUpperCase() !== presetData.nemesisGenerationHashSeed?.toUpperCase()) {
            throw new Error(
                `You are connecting to the wrong network. Expected generation hash is ${presetData.nemesisGenerationHashSeed} but got ${generationHash}`,
            );
        }

        for (const [index, nodeAccount] of (addresses.nodes || []).entries()) {
            if (!nodeAccount || !nodeAccount.main) {
                throw new Error('CA/Main account is required!');
            }
            const nodePreset = (presetData.nodes || [])[index];
            const mainAccount = PublicAccount.createFromPublicKey(nodeAccount.main.publicKey, presetData.networkType);
            const noFundsMessage = faucetUrl
                ? `Does your node signing address have any network coin? Send ${tokenAmount} tokens to ${mainAccount.address.plain()} via ${faucetUrl}/?recipient=${mainAccount.address.plain()}`
                : `Does your node signing address have any network coin? Send ${tokenAmount} tokens to ${mainAccount.address.plain()} .`;
            const mainAccountInfo = await this.getAccountInfo(repositoryFactory, mainAccount.address);

            if (!mainAccountInfo) {
                logger.error(`Node signing account ${mainAccount.address.plain()} is not valid. \n\n${noFundsMessage}`);
                continue;
            }
            if (this.isAccountEmpty(mainAccountInfo, currencyMosaicId)) {
                logger.error(
                    `Node signing account ${mainAccount.address.plain()} does not have enough currency. Mosaic id: ${currencyMosaicId}. \n\n${noFundsMessage}`,
                );
                continue;
            }
            const multisigAccountInfo = await this.getMultisigAccount(repositoryFactory, mainAccount.address);
            const params: TransactionFactoryParams = {
                presetData,
                nodePreset,
                nodeAccount,
                mainAccountInfo,
                mainAccount,
                deadline,
                maxFee: maxFee,
            };
            const transactions = await transactionFactory.createTransactions(params);
            if (!transactions.length) {
                logger.info(`There are not transactions to announce for node ${nodeAccount.name}`);
                continue;
            }

            const getTransactionDescription = (transaction: Transaction, signedTransaction: SignedTransaction): string => {
                return `${transaction.constructor.name} - Hash: ${signedTransaction.hash} - MaxFee ${
                    transaction.maxFee.compact() / Math.pow(10, currency.divisibility)
                }`;
            };

            const shouldAnnounce = async (transaction: Transaction, signedTransaction: SignedTransaction): Promise<boolean> => {
                const response: boolean =
                    ready ||
                    (
                        await prompt([
                            {
                                name: 'value',
                                message: `Do you want to announce ${getTransactionDescription(transaction, signedTransaction)}?`,
                                type: 'confirm',
                                default: true,
                            },
                        ])
                    ).value;
                if (!response) {
                    logger.info(`Ignoring transaction for node ${nodeAccount.name}`);
                }
                return response;
            };

            if (multisigAccountInfo) {
                logger.info(
                    `The node's main account is a multig account with Address: ${
                        multisigAccountInfo.minApproval
                    } min approval. Cosigners are: ${multisigAccountInfo.cosignatoryAddresses
                        .map((a) => a.plain())
                        .join(
                            ', ',
                        )}. The tool will ask for the cosigners provide keys in order to announce the transactions. These private keys are not stored anywhere!`,
                );
                const cosigners = await this.promptAccounts(
                    networkType,
                    multisigAccountInfo.cosignatoryAddresses,
                    multisigAccountInfo.minApproval,
                );
                if (!cosigners.length) {
                    logger.info('No cosigner has been provided, ignoring!');
                    continue;
                }
                const bestCosigner = await this.getBestCosigner(repositoryFactory, cosigners, currencyMosaicId);
                if (!bestCosigner) {
                    logger.info(`There is no cosigner with enough tokens to announce!`);
                    continue;
                }
                logger.info(`Cosigner ${bestCosigner.address.plain()} is initializing the transactions.`);
                if (cosigners.length >= multisigAccountInfo.minApproval) {
                    const aggregateTransaction = AggregateTransaction.createComplete(
                        deadline,
                        transactions.map((t) => t.toAggregate(mainAccount)),
                        networkType,
                        [],
                        maxFee,
                    );
                    const signedAggregateTransaction = bestCosigner.signTransactionWithCosignatories(
                        aggregateTransaction,
                        cosigners.filter((a) => a !== bestCosigner),
                        generationHash,
                    );
                    if (!(await shouldAnnounce(aggregateTransaction, signedAggregateTransaction))) {
                        continue;
                    }
                    try {
                        logger.info(`Announcing ${getTransactionDescription(aggregateTransaction, signedAggregateTransaction)}`);
                        await transactionService.announce(signedAggregateTransaction, listener).toPromise();
                        logger.info(`${getTransactionDescription(aggregateTransaction, signedAggregateTransaction)} has been confirmed`);
                    } catch (e) {
                        const message =
                            `Aggregate Complete Transaction ${signedAggregateTransaction.type} ${
                                signedAggregateTransaction.hash
                            } - signer ${signedAggregateTransaction.getSignerAddress().plain()} failed!! ` + e.message;
                        logger.error(message);
                    }
                } else {
                    const aggregateTransaction = AggregateTransaction.createBonded(
                        deadline,
                        transactions.map((t) => t.toAggregate(mainAccount)),
                        networkType,
                        [],
                        maxFee,
                    );
                    const signedAggregateTransaction = bestCosigner.signTransactionWithCosignatories(
                        aggregateTransaction,
                        cosigners.filter((a) => a !== bestCosigner),
                        generationHash,
                    );
                    const lockFundsTransaction: Transaction = LockFundsTransaction.create(
                        deadline,
                        currency.createRelative(10),
                        UInt64.fromUint(1000),
                        signedAggregateTransaction,
                        networkType,
                        maxFee,
                    );
                    const signedLockFundsTransaction = bestCosigner.sign(lockFundsTransaction, generationHash);
                    if (!(await shouldAnnounce(lockFundsTransaction, signedLockFundsTransaction))) {
                        continue;
                    }
                    if (!(await shouldAnnounce(aggregateTransaction, signedAggregateTransaction))) {
                        continue;
                    }

                    try {
                        logger.info(`Announcing ${getTransactionDescription(lockFundsTransaction, signedLockFundsTransaction)}`);
                        await transactionService.announce(signedLockFundsTransaction, listener).toPromise();
                        logger.info(`${getTransactionDescription(lockFundsTransaction, signedLockFundsTransaction)} has been confirmed`);

                        logger.info(`Announcing Bonded ${getTransactionDescription(aggregateTransaction, signedAggregateTransaction)}`);
                        await transactionService.announceAggregateBonded(signedAggregateTransaction, listener).toPromise();
                        logger.info(`${getTransactionDescription(aggregateTransaction, signedAggregateTransaction)} has been announced`);

                        logger.info('Aggregate Bonded Transaction has been confirmed! Your cosigners would need to cosign!');
                    } catch (e) {
                        const message =
                            `Aggregate Bonded Transaction ${signedAggregateTransaction.type} ${
                                signedAggregateTransaction.hash
                            } - signer ${signedAggregateTransaction.getSignerAddress().plain()} failed!! ` + e.message;
                        logger.error(message);
                    }
                }
            } else {
                const signerAccount = Account.createFromPrivateKey(
                    await CommandUtils.resolvePrivateKey(
                        networkType,
                        nodeAccount.main,
                        KeyName.Main,
                        nodeAccount.name,
                        'signing a transaction',
                    ),
                    networkType,
                );
                if (transactions.length == 1) {
                    const transaction = transactions[0];

                    const signedTransaction = signerAccount.sign(transactions[0], generationHash);
                    if (!(await shouldAnnounce(transaction, signedTransaction))) {
                        continue;
                    }
                    try {
                        logger.info(`Announcing ${getTransactionDescription(transaction, signedTransaction)}`);
                        await transactionService.announce(signedTransaction, listener).toPromise();
                        logger.info(`${getTransactionDescription(transaction, signedTransaction)} has been confirmed`);
                    } catch (e) {
                        const message =
                            `Simple Transaction ${signedTransaction.type} ${
                                signedTransaction.hash
                            } - signer ${signedTransaction.getSignerAddress().plain()} failed!! ` + e.message;
                        logger.error(message);
                    }
                } else {
                    const aggregateTransaction = AggregateTransaction.createComplete(
                        deadline,
                        transactions.map((t) => t.toAggregate(mainAccount)),
                        networkType,
                        [],
                        maxFee,
                    );
                    const signedAggregateTransaction = signerAccount.sign(aggregateTransaction, generationHash);
                    if (!(await shouldAnnounce(aggregateTransaction, signedAggregateTransaction))) {
                        continue;
                    }
                    try {
                        logger.info(`Announcing ${getTransactionDescription(aggregateTransaction, signedAggregateTransaction)}`);
                        await transactionService.announce(signedAggregateTransaction, listener).toPromise();
                        logger.info(`${getTransactionDescription(aggregateTransaction, signedAggregateTransaction)} has been confirmed`);
                    } catch (e) {
                        const message =
                            `Aggregate Complete Transaction ${signedAggregateTransaction.type} ${
                                signedAggregateTransaction.hash
                            } - signer ${signedAggregateTransaction.getSignerAddress().plain()} failed!! ` + e.message;
                        logger.error(message);
                    }
                }
            }
        }

        listener.close();
    }

    private async promptAccounts(networkType: NetworkType, expectedAddresses: Address[], minApproval: number): Promise<Account[]> {
        const providedAccounts: Account[] = [];
        const allowedAddresses = [...expectedAddresses];
        while (true) {
            console.log();
            const expectedDescription = allowedAddresses.map((address) => address.plain()).join(', ');
            const responses = await prompt([
                {
                    name: 'privateKey',
                    message: `Enter the 64 HEX private key of one of the addresses ${expectedDescription}. Already entered ${providedAccounts.length} out of ${minApproval} required cosigners.`,
                    type: 'password',
                    validate: AnnounceService.isValidPrivateKey,
                },
            ]);
            const privateKey = responses.privateKey;
            if (!privateKey) {
                console.log('Please provide the private key....');
            } else {
                const account = Account.createFromPrivateKey(privateKey, networkType);
                const expectedAddress = allowedAddresses.find((address) => address.equals(account.address));
                if (!expectedAddress) {
                    console.log();
                    console.log(
                        `Invalid private key. The entered private key has this ${account.address.plain()} address and it's not one of ${expectedDescription}. \n`,
                    );
                    console.log(`Please re enter private key...`);
                } else {
                    allowedAddresses.splice(allowedAddresses.indexOf(expectedAddress), 1);
                    providedAccounts.push(account);
                    if (!allowedAddresses.length) {
                        console.log('All cosigners have been entered.');
                        return providedAccounts;
                    }
                    if (providedAccounts.length == minApproval) {
                        console.log(`Min Approval of ${minApproval} has been reached. Aggregate Complete transaction can be created.`);
                        return providedAccounts;
                    }
                    const responses = await prompt([
                        {
                            name: 'more',
                            message: `Do you want to enter more cosigners?`,
                            type: 'confirm',
                            default: providedAccounts.length < minApproval,
                        },
                    ]);
                    if (!responses.more) {
                        return providedAccounts;
                    } else {
                        console.log('Please provide an additional private key....');
                    }
                }
            }
        }
    }

    public static isValidPrivateKey(input: string): boolean | string {
        return Convert.isHexString(input, 64) ? true : 'Invalid private key. It must be has 64 hex characters!';
    }

    private async getAccountInfo(repositoryFactory: RepositoryFactory, mainAccountAddress: Address): Promise<AccountInfo | undefined> {
        try {
            return await repositoryFactory.createAccountRepository().getAccountInfo(mainAccountAddress).toPromise();
        } catch (e) {
            return undefined;
        }
    }

    private async getMultisigAccount(
        repositoryFactory: RepositoryFactory,
        mainAccountAddress: Address,
    ): Promise<MultisigAccountInfo | undefined> {
        try {
            const info = await repositoryFactory.createMultisigRepository().getMultisigAccountInfo(mainAccountAddress).toPromise();
            return info.isMultisig() ? info : undefined;
        } catch (e) {
            return undefined;
        }
    }

    private getKnownNodeRepositoryInfos(knownUrls: string[]): Promise<RepositoryInfo[]> {
        logger.info(`Looking for the best node out of: ${knownUrls.join(', ')}`);
        return Promise.all(
            knownUrls.map(
                async (restGatewayUrl): Promise<RepositoryInfo> => {
                    const repositoryFactory = new RepositoryFactoryHttp(restGatewayUrl);
                    try {
                        const generationHash = await repositoryFactory.getGenerationHash().toPromise();
                        const chainInfo = await repositoryFactory.createChainRepository().getChainInfo().toPromise();
                        return {
                            restGatewayUrl,
                            repositoryFactory,
                            generationHash,
                            chainInfo,
                        };
                    } catch (e) {
                        const message = `There has been an error talking to node ${restGatewayUrl}. Error: ${e.message}}`;
                        logger.warn(message);
                        return {
                            restGatewayUrl: restGatewayUrl,
                            repositoryFactory,
                        };
                    }
                },
            ),
        );
    }

    private sortByHeight(repos: RepositoryInfo[]): RepositoryInfo[] {
        return repos
            .filter((b) => b.chainInfo)
            .sort((a, b) => {
                if (!a.chainInfo) {
                    return 1;
                }
                if (!b.chainInfo) {
                    return -1;
                }
                return b.chainInfo.height.compare(a.chainInfo.height);
            });
    }

    private async getBestCosigner(
        repositoryFactory: RepositoryFactory,
        cosigners: Account[],
        currencyMosaicId: MosaicId | undefined,
    ): Promise<Account | undefined> {
        const accountRepository = repositoryFactory.createAccountRepository();
        for (const cosigner of cosigners) {
            try {
                const accountInfo = await accountRepository.getAccountInfo(cosigner.address).toPromise();
                if (!this.isAccountEmpty(accountInfo, currencyMosaicId)) {
                    return cosigner;
                }
            } catch (e) {}
        }
        return undefined;
    }

    private isAccountEmpty(mainAccountInfo: AccountInfo, currencyMosaicId: MosaicId | undefined): boolean {
        if (!currencyMosaicId) {
            throw new Error('Mosaic Id must not be null!');
        }
        const mosaic = mainAccountInfo.mosaics.find((m) => m.id.equals(currencyMosaicId));
        return !mosaic || mosaic.amount.compare(UInt64.fromUint(0)) < 1;
    }
}
