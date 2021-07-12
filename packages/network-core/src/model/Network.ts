import { NetworkType } from 'symbol-sdk';

export enum Network {
    mainnet = 'mainnet',
    testnet = 'testnet',
    privateTest = 'privateTest',
    private = 'private',
    mijinTest = 'mijinTest',
    mijin = 'mijin',
}

export const toNetworkType = (network: Network): NetworkType => {
    switch (network) {
        case Network.private: {
            return NetworkType.PRIVATE;
        }
        case Network.privateTest: {
            return NetworkType.PRIVATE_TEST;
        }
        case Network.testnet: {
            return NetworkType.TEST_NET;
        }
        case Network.mainnet: {
            return NetworkType.MAIN_NET;
        }
        case Network.mijinTest: {
            return NetworkType.MIJIN_TEST;
        }
        case Network.mijin: {
            return NetworkType.MIJIN;
        }
    }
    throw new Error(`Invalid network ${network}!!!`);
};

export const toDescription = (network: Network): string => {
    switch (network) {
        case Network.private: {
            return 'Private';
        }
        case Network.privateTest: {
            return 'Private Test';
        }
        case Network.testnet: {
            return 'Testnet';
        }
        case Network.mainnet: {
            return 'Mainnet';
        }
        case Network.mijinTest: {
            return 'Mijin Test';
        }
        case Network.mijin: {
            return 'Mijin';
        }
    }
    throw new Error(`Invalid network ${network}!!!`);
};
