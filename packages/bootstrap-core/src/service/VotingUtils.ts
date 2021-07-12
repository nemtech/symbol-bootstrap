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
import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs';
import * as noble from 'noble-ed25519';
import { join } from 'path';
import { Convert, Crypto } from 'symbol-sdk';
import * as nacl from 'tweetnacl';

export interface KeyPair {
    privateKey: Uint8Array;
    publicKey: Uint8Array;
}
export interface CryptoImplementation {
    name: string;
    createKeyPairFromPrivateKey: (privateKey: Uint8Array) => Promise<KeyPair>;
    sign: (keyPair: KeyPair, data: Uint8Array) => Promise<Uint8Array>;
}

export interface VotingKeyAccount {
    readonly startEpoch: number;
    readonly endEpoch: number;
    readonly publicKey: string;
}

export type VotingKeyFile = VotingKeyAccount & { filename: string };

export class VotingUtils {
    public static nobleImplementation: CryptoImplementation = {
        name: 'Noble',
        createKeyPairFromPrivateKey: async (privateKey: Uint8Array): Promise<KeyPair> => {
            const publicKey = await noble.getPublicKey(privateKey);
            return { privateKey, publicKey: publicKey };
        },
        sign: async (keyPair: KeyPair, data: Uint8Array): Promise<Uint8Array> => {
            return await noble.sign(data, keyPair.privateKey);
        },
    };

    public static tweetNaClImplementation: CryptoImplementation = {
        name: 'TweetNaCl',
        createKeyPairFromPrivateKey: async (privateKey: Uint8Array): Promise<KeyPair> => {
            const { publicKey } = nacl.sign.keyPair.fromSeed(privateKey);
            return { privateKey, publicKey };
        },

        sign: async (keyPair: KeyPair, data: Uint8Array): Promise<Uint8Array> => {
            const secretKey = new Uint8Array(64);
            secretKey.set(keyPair.privateKey);
            secretKey.set(keyPair.publicKey, 32);
            return nacl.sign.detached(data, secretKey);
        },
    };

    public static implementations = [VotingUtils.nobleImplementation, VotingUtils.tweetNaClImplementation];

    constructor(private readonly implementation: CryptoImplementation = VotingUtils.nobleImplementation) {}
    public insert(result: Uint8Array, value: Uint8Array, index: number): number {
        result.set(value, index);
        return index + value.length;
    }

    public async createVotingFile(
        secret: string,
        votingKeyStartEpoch: number,
        votingKeyEndEpoch: number,
        unitTestPrivateKeys: Uint8Array[] | undefined = undefined,
    ): Promise<Uint8Array> {
        const items = votingKeyEndEpoch - votingKeyStartEpoch + 1;
        const headerSize = 64 + 16;
        const itemSize = 32 + 64;
        const totalSize = headerSize + items * itemSize;
        const rootPrivateKey = await this.implementation.createKeyPairFromPrivateKey(Convert.hexToUint8(secret));
        const result = new Uint8Array(totalSize);
        //start-epoch (8b),
        let index = 0;
        index = this.insert(result, Convert.numberToUint8Array(votingKeyStartEpoch, 8), index);

        //end-epoch (8b),
        index = this.insert(result, Convert.numberToUint8Array(votingKeyEndEpoch, 8), index);

        // could it have other values????
        //last key identifier (8b) - for fresh file this is 0xFFFF'FFFF'FFFF'FFFF (a.k.a. Invalid_Id)
        index = this.insert(result, Convert.hexToUint8('FFFFFFFFFFFFFFFF'), index);

        //last wipe key identifier (8b) - again, for fresh file this is 0xFFFF'FFFF'FFFF'FFFF (Invalid_Id)
        index = this.insert(result, Convert.hexToUint8('FFFFFFFFFFFFFFFF'), index);

        // root public key (32b) - this is root public key that is getting announced via vote link tx
        index = this.insert(result, rootPrivateKey.publicKey, index);
        // start-epoch (8b), \ those two are exactly same one, as top level, reason is this was earlier a tree,
        index = this.insert(result, Convert.numberToUint8Array(votingKeyStartEpoch, 8), index);

        //end-epoch (8b), / and each level holds this separately, so we left it as is
        index = this.insert(result, Convert.numberToUint8Array(votingKeyEndEpoch, 8), index);
        /// what follows are bound keys, there are (end - start + 1) of them.

        // each key is:
        for (let i = 0; i < items; i++) {
            // random PRIVATE key (32b)
            const randomPrivateKey = unitTestPrivateKeys ? unitTestPrivateKeys[i] : Crypto.randomBytes(32);
            if (randomPrivateKey.length != 32) {
                throw new Error(`Invalid private key size ${randomPrivateKey.length}!`);
            }
            const randomKeyPar = await this.implementation.createKeyPairFromPrivateKey(randomPrivateKey);
            index = this.insert(result, randomPrivateKey, index);
            // signature (64b)
            // now the signature is usual signature done using ROOT private key on a following data:
            //   (public key (32b), identifier (8b))
            //
            //   identifier is simply epoch, but, most importantly keys are written in REVERSE order.
            //
            //   i.e. say your start-epoch = 2, end-epoch = 42
            const identifier = Convert.numberToUint8Array(votingKeyEndEpoch - i, 8);
            const signature = await this.implementation.sign(rootPrivateKey, Uint8Array.from([...randomKeyPar.publicKey, ...identifier]));
            index = this.insert(result, signature, index);
        }
        //
        // root private key is discarded after file is created.
        // header:
        //   2, 42, ff.., ff..., (root pub), 2, 42
        // keys:
        //   (priv key 42, sig 42), (priv key 41, sig 31), ..., (priv key 2, sig 2)
        //
        // every priv key should be cryptographically random,

        return result;
    }

    public readVotingFile(file: Uint8Array): VotingKeyAccount {
        //start-epoch (8b),
        const votingKeyStartEpoch = Convert.uintArray8ToNumber(file.slice(0, 8));
        //end-epoch (8b),
        const votingKeyEndEpoch = Convert.uintArray8ToNumber(file.slice(8, 16));
        const votingPublicKey = Convert.uint8ToHex(file.slice(32, 64));

        const items = votingKeyEndEpoch - votingKeyStartEpoch + 1;
        const headerSize = 64 + 16;
        const itemSize = 32 + 64;
        const totalSize = headerSize + items * itemSize;

        if (file.length != totalSize) {
            throw new Error(`Unexpected voting key file. Expected ${totalSize} but got ${file.length}`);
        }
        return {
            publicKey: votingPublicKey,
            startEpoch: votingKeyStartEpoch,
            endEpoch: votingKeyEndEpoch,
        };
    }

    public loadVotingFiles(folder: string): VotingKeyFile[] {
        if (!existsSync(folder)) {
            return [];
        }
        return readdirSync(folder)
            .map((filename: string) => {
                const currentPath = join(folder, filename);
                if (lstatSync(currentPath).isFile() && filename.startsWith('private_key_tree') && filename.endsWith('.dat')) {
                    return { ...this.readVotingFile(readFileSync(currentPath)), filename };
                } else {
                    return undefined;
                }
            })
            .filter((i) => i)
            .map((i) => i as VotingKeyFile)
            .sort((a, b) => a.startEpoch - b.startEpoch);
    }
}
