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
import { readFileSync } from 'fs';
import 'mocha';
import { Convert, KeyPair } from 'symbol-sdk';
import { VotingKeyAccount, VotingUtils } from '../../src/service';
describe('VotingUtils', () => {
    async function assertVotingKey(
        expectedVotingKeyFile: Uint8Array,
        privateKey: string,
        votingKeyStartEpoch: number,
        votingKeyEndEpoch: number,
    ) {
        const headerSize = 64 + 16;
        const itemSize = 32 + 64;
        //This files have been created from the original catapult tools's votingkey

        const votingPublicKey = Convert.uint8ToHex(KeyPair.createKeyPairFromPrivateKeyString(privateKey).publicKey);
        const items = (expectedVotingKeyFile.length - headerSize) / itemSize;

        const unitTestPrivateKeys: Uint8Array[] = [];
        // each key is:
        for (let i = 0; i < items; i++) {
            // random PRIVATE key (32b)
            const start = headerSize + i * itemSize;
            const end = start + 32;
            const unitTestPrivateKey = expectedVotingKeyFile.slice(start, end);
            unitTestPrivateKeys.push(unitTestPrivateKey);
        }

        const service = new VotingUtils();
        const votingKeyFile = await service.createVotingFile(privateKey, votingKeyStartEpoch, votingKeyEndEpoch, unitTestPrivateKeys);
        expect(votingKeyFile.length).eq(expectedVotingKeyFile.length);
        const header = votingKeyFile.subarray(0, headerSize);
        const expectedHeader = expectedVotingKeyFile.subarray(0, headerSize);
        expect(header).deep.eq(expectedHeader);
        expect(Convert.uint8ToHex(votingKeyFile)).eq(Convert.uint8ToHex(expectedVotingKeyFile));
        const expected: VotingKeyAccount = {
            startEpoch: votingKeyStartEpoch,
            endEpoch: votingKeyEndEpoch,
            publicKey: votingPublicKey,
        };
        expect(service.readVotingFile(votingKeyFile)).deep.eq(expected);
    }

    it('createVotingFile voting key 1', async () => {
        const votingKeyStartEpoch = 5;
        const votingKeyEndEpoch = 10;
        const privateKey = 'EFE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1';
        const testFile = new Uint8Array(readFileSync('./test/votingkeys/private_key_tree1.dat'));
        await assertVotingKey(testFile, privateKey, votingKeyStartEpoch, votingKeyEndEpoch);
    });

    it.skip('createVotingFile voting key 2', async () => {
        // TOO SLOW! I had to disable it.
        const votingKeyStartEpoch = 1;
        const votingKeyEndEpoch = 26280;
        const privateKey = 'EFE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1';
        const testFile = new Uint8Array(readFileSync('./test/votingkeys/private_key_tree2.dat'));
        await assertVotingKey(testFile, privateKey, votingKeyStartEpoch, votingKeyEndEpoch);
    });

    it('createVotingFile voting key 3', async () => {
        const votingKeyStartEpoch = 10;
        const votingKeyEndEpoch = 10;
        const privateKey = 'EFE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1';
        const testFile = new Uint8Array(readFileSync('./test/votingkeys/private_key_tree3.dat'));
        await assertVotingKey(testFile, privateKey, votingKeyStartEpoch, votingKeyEndEpoch);
    });

    it('createVotingFile voting key 4', async () => {
        const votingKeyStartEpoch = 1;
        const votingKeyEndEpoch = 1000;
        const privateKey = 'EFE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1';
        const testFile = new Uint8Array(readFileSync('./test/votingkeys/private_key_tree4.dat'));
        await assertVotingKey(testFile, privateKey, votingKeyStartEpoch, votingKeyEndEpoch);
    });

    it('createVotingFile voting key 5', async () => {
        const votingKeyStartEpoch = 1;
        const votingKeyEndEpoch = 10000;
        const privateKey = 'AAAAF0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1';
        const testFile = new Uint8Array(readFileSync('./test/votingkeys/private_key_tree5.dat'));
        await assertVotingKey(testFile, privateKey, votingKeyStartEpoch, votingKeyEndEpoch);
    });
    it('createVotingFile voting key gimre 1', async () => {
        const votingKeyStartEpoch = 13;
        const votingKeyEndEpoch = 34;
        const privateKey = '0000000000000000000000000000000000000000000000000000000000000001';
        const testFile = Convert.hexToUint8(
            '0d000000000000002200000000000000ffffffffffffffffffffffffffffffff4cb5abf6ad79fbf5abbccafcc269d85cd2651ed4b885b5869f241aedf0a5ba290d0000000000000022000000000000000000000000000000000000000000000000000000000000000000000000000003745e8481844ef3e0cb6b23b3b55a95ee0dd233d4472efb591ba6210e758e0577fb3c487c9c9c92b1d8b0893364aad0c98167713b739fbb2caa8e01ca1e7cf600000000000000000000000000000000000000000000000000000000000000000536d91ac8eb78b1af20b2576be6e267b6ce48a69121937346d785745862881ed21c2fdb43d00a8dd5c517c5c78cb5a6f36a27dc88e45a1c12f7855ea3e9af9408000000000000000000000000000000000000000000000000000000000000000870f396b7f93e7a221501e21dfd27a4843e87ba779b0029e540a36f89755b51aa405b8fe50456745e86c7c814276d245aaedd2cf419118d305c92f03402869402000000000000000000000000000000000000000000000000000000000000000d34ffc8bce0520ac55966b354930feed16d517bef17c14c340cf3dd967748db2963edd6658bb28d7a797ac25d94582b30d5a9f5fb98e44673a763ddd77b58ff0700000000000000000000000000000000000000000000000000000000000000150761ef44b6f00d9b49f9a056c35b65aad81f708498c2892b28c870a9b8f5a1812ee7913b5d864edc6960b2ea576f2576909e0992fa75c83aa785853c25a47c0e0000000000000000000000000000000000000000000000000000000000000022f75d71a44e9deb35d919d691349cc31df2931ed679313838e827a3410dc1d252d0b08fa725fa366e0e0e2079d8866b267be7bfe7a9ee715a2379f34767dbe60d00000000000000000000000000000000000000000000000000000000000000378912c364cd475c6e5ba59dcc4c9a35004e4e902748f9724c145725c051869f2e6b7e8aa9b3e305558d2891227e365f780b11b2e692a68173fac7895378beff03000000000000000000000000000000000000000000000000000000000000005928fca21c7fabf3e194e8435c41b9352e24ef2ea6f45d08a6e4133734941c2a521e0382fdce9aec7987f52f80d3bca92337a445262c4aaee7c5c97e7a76aeba0000000000000000000000000000000000000000000000000000000000000000903b4efbba4a926aed1db317b6de0fbbc5e70b99e885b4937a3aae63252a3e4164b4a98bac77890460611af6b38aaa7ac67168cc473c5b763aea1b32f2036dd70800000000000000000000000000000000000000000000000000000000000000e97a7f0ecfe7fb752d2b97345b437a14232b70f5ec93a9413225dce4c634b60991dec0ef49e53e3561569709ddce244185d2ef676d69e4d5f380bd0aed884c8504000000000000000000000000000000000000000000000000000000000000007968ecc24af8312888e7fdd358c55dbe70523304e5a2723d3c6627ad0525f07b24cc586626e3add8f0d96f7e9b3ef2c18da53d1fd4e637ac6fe7e9a99df234f00d0000000000000000000000000000000000000000000000000000000000000062f3430b40025bb4fdd57e6ef557cd340a2edb9d2cec26fc61d9427b22bbcdd3ea6584ddd3b71d38bd0a5cc42d9d131bdcf982fef21bff521d889456f40c9cce0400000000000000000000000000000000000000000000000000000000000000db16e586d65cf3253ce72f57a720885e4f71bcb6f66662b853b14e7a3f9b4713c2d91a3408dd6a8ced8876c781f5155cc5647c2bbba4bca869ccde14abc0668002000000000000000000000000000000000000000000000000000000000000003dce7be3b0d78a155f0c8c1a7198c620a4e8b23839b3c55f2559053945a3667f63896785b45626a060e91c25be0f1cdbf2dd739a8c4b6be8d753081cb1e449c30b000000000000000000000000000000000000000000000000000000000000001817170bf187a5e6972baf4858c4bcb58ee698f3722bd5d9403af7bf93dc380062e79c0cda9af08154990f15f3a97fa237e760efd456c1c309f94348ccbe140a0e00000000000000000000000000000000000000000000000000000000000000559bae65ac572c4e034b9a0f11a9e7ded83abb7e1549bf0563781a7602e2cb9b3d5b5aa784df1f9b898896f3e3d5bfc7993934316156d2c41ed1176c2bd2397d0e000000000000000000000000000000000000000000000000000000000000006de2314a2d851afac51fb455bba223355feb9292d8c1b8f4b8adc59d8a6b827b776dd6061d891d93e8c924f42da6ec430fcb158b557180d2af1d02d27224022f0d00000000000000000000000000000000000000000000000000000000000000c23cc4de002506742812d45ae0343586aa816f2cd6c118b76ec3fa3c2d4273840424295981b808bf1cab489e8bb1fba6ab70d7c35a9b68d7db19dc9ee2bf7f9206000000000000000000000000000000000000000000000000000000000000002f4801ea571ac8c324a4b77922e3484f33b8a47f18301260a3bdc4e1d25eb66b042e12d922787c081ba382bf00d61e3ec88a5972625f6363921c165ab37a58c60200000000000000000000000000000000000000000000000000000000000000f194dc9d492b6e1e810a9931d588490b8ff216c26609241c7becc5744b702ea36715571399d69c7db4cc02a482af37b853a6a5fee9761688e61e33db4029ea700f000000000000000000000000000000000000000000000000000000000000002019c8643b2eaeb25f0e92744804647378855e72fdb6db471c52fcf0e99f8bf7c0ee611a2d4d0802fd18cd54874fa0e01eb939ba214c8e716653db27800dfa0b0f0000000000000000000000000000000000000000000000000000000000000011a4710bfce396facb91adf88ffeb079a3d5ce83b63e15b535b7c296ae0ac0645f52d2c0576a88f2c376ca61614cb75cdd5b45de7ca72f6ab8c77f8af5f0e36700',
        );
        await assertVotingKey(testFile, privateKey, votingKeyStartEpoch, votingKeyEndEpoch);
    });
    it('createVotingFile voting key gimre 2', async () => {
        const votingKeyStartEpoch = 1482;
        const votingKeyEndEpoch = 1500;
        const privateKey = '4CB5ABF6AD79FBF5ABBCCAFCC269D85CD2651ED4B885B5869F241AEDF0A5BA29';
        const testFile = Convert.hexToUint8(
            'ca05000000000000dc05000000000000ffffffffffffffffffffffffffffffffcff1a82f51efef1c1718ba68b9ba3aa89532eb4521b134c19dbec1978b7bdfdbca05000000000000dc05000000000000030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f2021224c47f7117ad5788ffadaa69a2f61ad40841a594692fa803d295dc6873fd8e0fed324a52726d47827af42181d40db98baa9f7e73053ab492576fac599f2e6eb0005060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20212223248aeb5f9c5cbcf898d3a5a5aee0c1c1271dc5b04bc3cd442193b4545968fde1c0c0155214306c031596635bdafaa2dc48a90ae6565678bc71ef9a68a22991cd0c08090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f2021222324252627d1a06bf2c59efcc00fac9fc03e6249f08e1d149f08a2a6d8807c5b492a5665afeb742080fa0128e7f02905e3cf067e26c64330e94eada239075f5cbee1a2860b0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c89e5f9c466ae80ed0a45963e629f1daf927fdcb638be81d8ff157390bf4a669a9fc2bb8de8d4153ef5487150fda31e9079756638e2cd1debb3647e497955c70315161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f3031323334042fa8d4a86cdc3c14ece0a785383f7ed6b1de70397f37b3aa9a254c04321987ed5626e59333f9f1a5d0845ceaad1acced1934de4ad45fe95989aac3503ce40b22232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404133dcb0c7755c62c00035ebfc783d783034f741b1e7bef0630d038d5eed9196076939bc585af25bbb898cb8441205a4da089e5a2f4c8e6d3f9d98a8519709920c3738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f5051525354555637b88b9631358ac8ddf9ab3e349f84527ced5d4b780b56975861f55f7920a32cfefb23d8685ad808a820621b858b932bdb9c4d088e6ca4e30e5c76b7996bee05595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778b3df77acd72732ca035fbef2befdb98428859d3225ca66eeb4a00d1ecfdd582872e99192acdb38e139928f36a0622d4f9cc39e1f2fe8df51ac33942d34f9fa0b909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeaf5f83915097d2a1b4891e4f7addd549476f2354c4aa34015f53dc28b8760b95cb2283ea6f352e975d463eaaa6f0fa3a2dd05fbf6e0ff89c2137811d3d0ce3ce01e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff00010203040506070858bb18e3f31c9415c725955799c5733f47fddfbad344ced76aa3351c70ee2ca1935a7d9ef54edb2041d78dfd683551a3c2e3bac8e004bdab2ca11639f7612b0f797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f90919293949596979817a1f6459e0c3d9f7bd8dede08fcc5ec842b84735f830a86f464ee6359da4c984c5d0a96a594f04bbfe18e933af4adf5262101d4fbaf26d0f58b76894b925f0862636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f80816cb0ca1bb406e7c4cb2b11e16a481527f7628af11ce56173f861473ac9ea54106f2f2c7378f7ef92deec95c1b47ae80bcd3828225d36c87d8ac8fee8d09f660edbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9faf0b4d53d015b5b1f4543871edc23144f1e39105fc995e298d9359bc8f97f11b4210d942003391189cd47d71a1513824da980c79ae4dfa7eb06e2fb142ec1c60b3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c246976894bd286cbd03bded94c17f46cf06424c7100f626c75a1349648518a85e367bb13ec2cd730290a2c36e4f3be97437798789f8508da77fc2353416a480018191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f3031323334353637820d7e0b4cbe6ea18c51646d5812d5466b6d117c159bddbe9ba80ce380d1986785876cae05b84576296ee86d46ec39ec8af5aaa480942aeddb1ec0e3b5c29b0155565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737420e0afef1ca2e914f90f14de387e98d01995bda1d603df4a08c8e4669c3f5eb9d2ff06ba0407375ccf9864926b89b25c46c24fef76d392c34ef9e63c3076f0006d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c231cbc08c42c7827cd35e80fb632a951f17211aeb7d32a9aee10ee96218722129ea4d4d3ca4d452b417e7a0cdef64b3ed68786c4b92846fa2db2f456af55ad0bc2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e16243e13e89dfbace1b04ff8f65121760fb7f2d2af76c2af19f338c5e53ad96e5eb3c23d4115bf2cb300e71102430010eeebf0049cd755069a90aaaefa4c7640c2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4ebec6a949ce9b25f0d793865f8f49ce74c571586fa1e872141d21a3223a442811250c4c5fe74cac3a729be52d33ba34212c203ef20b380fb72dd81cb825cd880a',
        );
        await assertVotingKey(testFile, privateKey, votingKeyStartEpoch, votingKeyEndEpoch);
    });

    it('createVotingFile voting key gimre 3', async () => {
        const votingKeyStartEpoch = 4294967293;
        const votingKeyEndEpoch = 4294967295;
        const privateKey = '201552D1EC8F3FD62B3D03C09CD083E381BE6C3AED72FB21852298913CAAAFB1';
        const testFile = Convert.hexToUint8(
            'fdffffff00000000ffffffff00000000ffffffffffffffffffffffffffffffff089b5ce0f9f9c951c783751b0511cafa1270b68590a0e491a9a3f520d3602090fdffffff00000000ffffffff0000000012f98b7cb64a6d840931a2b624fb1eacafa2c25c3ef0018cd67e8d470a248b2f7c4b52452002d535ca1450ec03d42a0f401a2b5313acb86388a757651490773aaaf16c39ad78d5dd4c1f1c8d8cf7341e20dbe2b1b851f73c3e86c75536758305b5593870940f28daee262b26367b69143ad85e43048d23e624f4ed8008c0427f2a63a3224589dd9611b8a156a584946ff76e9cecb5b2e59bf038253730fea8bf40735253838b4a017a0b8a755214d4ebde7e9b15a9be271551554f14b6fe1c056cfc879abcca78f5a4c9739852c7c643aec3990e93bf4c6f685eb58224b16a5902bc0c6deb7fdfc86aa4293246182a66b277af4247d9f26e581d3dd8ad6e3309c12d261319c5798075daaa43cf9067c7aa2bb5028698bfd65779611e71de7505',
        );
        await assertVotingKey(testFile, privateKey, votingKeyStartEpoch, votingKeyEndEpoch);
    });

    type VectorData = {
        privateKey: string;
        publicKey: string;
        length: number;
        data: string;
        signature: string;
    };

    const testSignVectorList: VectorData[] = JSON.parse(readFileSync('./test/votingkeys/2.test-sign.json', 'utf8'));
    VotingUtils.implementations.forEach((implementation) =>
        it(`2.test-sign.json ${implementation.name} `, async () => {
            for (const vector of testSignVectorList) {
                const keyPair = {
                    privateKey: Convert.hexToUint8(vector.privateKey),
                    publicKey: Convert.hexToUint8(vector.publicKey),
                };
                const privateKey = keyPair.privateKey;
                expect(await implementation.createKeyPairFromPrivateKey(privateKey)).deep.eq(keyPair);
                const resolvedSignature = await implementation.sign(keyPair, Convert.hexToUint8(vector.data));
                expect(Convert.uint8ToHex(resolvedSignature)).eq(vector.signature);
            }
        }),
    );
});
