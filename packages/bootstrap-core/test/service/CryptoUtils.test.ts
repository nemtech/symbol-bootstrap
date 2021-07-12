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
import { PrivateKeySecurityMode } from '../../src/model';
import { BootstrapUtils } from '../../src/service';
import { CryptoUtils } from '../../src/service/CryptoUtils';

describe('CryptoUtils', () => {
    it('encrypt decrypt', () => {
        const object = {
            version: 2,
            networkType: 152,
            anotherPrivateKey: 'abc',
            anotherMainPrivateKey: '123',
            nemesisGenerationHashSeed: '6C1B92391CCB41C96478471C2634C111D9E989DECD66130C0430B5B8D20117CD',
            privateKeySecurityMode: 'ENCRYPT',
            nodes: [
                {
                    name: 'api-node',
                    friendlyName: 'F718535',
                    roles: 'Peer,Api,Voting',
                    main: {
                        privateKey: '6A4E05F63EA94949D1043D59A704CBA1E1FA1F57BF99E41D5F5DCF89E549D4E8',
                        publicKey: 'F71853563BEE2C580C9AFA0A1A84203D14868C19279ABAABF8ADE89AF9AA9B30',
                        address: 'TAEAUXUZOFODY2ZQZGV5DUVQ2TN3HBSXKGBEH5Q',
                    },
                    transport: {
                        privateKey: 'E07C107F25DE9CBBC301683F527EBE05A47572EE810DB91D5C4FA6A7E0B9D5BF',
                        publicKey: '41470F3A43095F493319A2241C3059B5EA0ECC89318E6ED32381A4AAEC4D13D1',
                        address: 'TCZARKJGP4RXWWTUZRRYW4X5Z7UQFUXQ5K2VIJQ',
                    },
                    remote: {
                        privateKey: '6B08368668E3AB32466FCFBC2B6FC0C4A3FB254887FD485DD04DB211992E6B94',
                        publicKey: '0C2172A87DC43C02AC381907E865811228BD03E8CF88169BC7DA22B4F9BDD8E6',
                        address: 'TAJUGHLVMRJL6YMBLWOSOOLZGN73CGIRKI3SR5I',
                    },
                    voting: {
                        privateKey: 'B161B7E2205F0FB577594A47566FA735582997682D99C67B780DB45BD805A4A0',
                        publicKey: 'DB15D252786AE741CF2DD4B07D0BFC2E26999804B4EAE0075407AD1D7AF8F7F3',
                        address: 'TA37ECJGSNMSCKCPK5KW4UH74QBWZU24QZRUWNA',
                    },
                    vrf: {
                        privateKey: 'AA4FD1C8CBE533CB364101B6CF25DE57DFBF067DDD20B944A91E2045627DA981',
                        publicKey: 'C676A0987DEF74CE5B06FFB34CACFA7AF56BC47A3C3C6580B6D3D593EB4EE4C6',
                        address: 'TCMFERLVMH7JRYY54AAOKEPW6J2VTPVAVAI4GHA',
                    },
                },
            ],
        };

        const password = '1234';
        const encryptedObject = CryptoUtils.encrypt(object, password);
        const encryptedObjectJson = JSON.stringify(encryptedObject, null, 2);
        console.log(BootstrapUtils.toYaml(encryptedObject));
        expect(encryptedObjectJson).not.deep.eq(object);

        expect(CryptoUtils.encryptedCount(object)).eq(0);
        expect(CryptoUtils.encryptedCount(encryptedObject)).eq(7);

        const decryptedObject = CryptoUtils.decrypt(JSON.parse(encryptedObjectJson), password);
        expect(decryptedObject).deep.eq(object);

        const decryptedObject2 = CryptoUtils.decrypt(object, password);
        expect(decryptedObject2).deep.eq(object);
    });

    it('encrypt decrypt invalid password', () => {
        const object = {
            version: 2,
            networkType: 152,
            anotherPrivateKey: 'abc',
            anotherMainPrivateKey: '123',
            nemesisGenerationHashSeed: '6C1B92391CCB41C96478471C2634C111D9E989DECD66130C0430B5B8D20117CD',
            privateKeySecurityMode: 'ENCRYPT',
            nodes: [
                {
                    name: 'api-node',
                    friendlyName: 'F718535',
                    roles: 'Peer,Api,Voting',
                    main: {
                        privateKey: '6A4E05F63EA94949D1043D59A704CBA1E1FA1F57BF99E41D5F5DCF89E549D4E8',
                        publicKey: 'F71853563BEE2C580C9AFA0A1A84203D14868C19279ABAABF8ADE89AF9AA9B30',
                        address: 'TAEAUXUZOFODY2ZQZGV5DUVQ2TN3HBSXKGBEH5Q',
                    },
                    transport: {
                        privateKey: 'E07C107F25DE9CBBC301683F527EBE05A47572EE810DB91D5C4FA6A7E0B9D5BF',
                        publicKey: '41470F3A43095F493319A2241C3059B5EA0ECC89318E6ED32381A4AAEC4D13D1',
                        address: 'TCZARKJGP4RXWWTUZRRYW4X5Z7UQFUXQ5K2VIJQ',
                    },
                    remote: {
                        privateKey: '6B08368668E3AB32466FCFBC2B6FC0C4A3FB254887FD485DD04DB211992E6B94',
                        publicKey: '0C2172A87DC43C02AC381907E865811228BD03E8CF88169BC7DA22B4F9BDD8E6',
                        address: 'TAJUGHLVMRJL6YMBLWOSOOLZGN73CGIRKI3SR5I',
                    },
                    voting: {
                        privateKey: 'B161B7E2205F0FB577594A47566FA735582997682D99C67B780DB45BD805A4A0',
                        publicKey: 'DB15D252786AE741CF2DD4B07D0BFC2E26999804B4EAE0075407AD1D7AF8F7F3',
                        address: 'TA37ECJGSNMSCKCPK5KW4UH74QBWZU24QZRUWNA',
                    },
                    vrf: {
                        privateKey: 'AA4FD1C8CBE533CB364101B6CF25DE57DFBF067DDD20B944A91E2045627DA981',
                        publicKey: 'C676A0987DEF74CE5B06FFB34CACFA7AF56BC47A3C3C6580B6D3D593EB4EE4C6',
                        address: 'TCMFERLVMH7JRYY54AAOKEPW6J2VTPVAVAI4GHA',
                    },
                },
            ],
        };

        const password = '1234';
        const encryptedObject = CryptoUtils.encrypt(object, password);
        try {
            CryptoUtils.decrypt(encryptedObject, 'invalidPassword');
            expect(1).eq(0);
        } catch (e) {
            expect(e.message).eq('Value could not be decrypted!');
        }
    });

    it('it removes private keys', () => {
        const object = {
            version: 2,
            networkType: 152,
            anotherPrivateKey: 'abc',
            anotherMainPrivateKey: '123',
            nemesisGenerationHashSeed: '6C1B92391CCB41C96478471C2634C111D9E989DECD66130C0430B5B8D20117CD',
            privateKeySecurityMode: 'ENCRYPT',
            nodes: [
                {
                    name: 'api-node',
                    friendlyName: 'F718535',
                    roles: 'Peer,Api,Voting',
                    main: {
                        privateKey: '6A4E05F63EA94949D1043D59A704CBA1E1FA1F57BF99E41D5F5DCF89E549D4E8',
                        publicKey: 'F71853563BEE2C580C9AFA0A1A84203D14868C19279ABAABF8ADE89AF9AA9B30',
                        address: 'TAEAUXUZOFODY2ZQZGV5DUVQ2TN3HBSXKGBEH5Q',
                    },
                    transport: {
                        privateKey: 'E07C107F25DE9CBBC301683F527EBE05A47572EE810DB91D5C4FA6A7E0B9D5BF',
                        publicKey: '41470F3A43095F493319A2241C3059B5EA0ECC89318E6ED32381A4AAEC4D13D1',
                        address: 'TCZARKJGP4RXWWTUZRRYW4X5Z7UQFUXQ5K2VIJQ',
                    },
                    remote: {
                        privateKey: '6B08368668E3AB32466FCFBC2B6FC0C4A3FB254887FD485DD04DB211992E6B94',
                        publicKey: '0C2172A87DC43C02AC381907E865811228BD03E8CF88169BC7DA22B4F9BDD8E6',
                        address: 'TAJUGHLVMRJL6YMBLWOSOOLZGN73CGIRKI3SR5I',
                    },
                    voting: {
                        privateKey: 'B161B7E2205F0FB577594A47566FA735582997682D99C67B780DB45BD805A4A0',
                        publicKey: 'DB15D252786AE741CF2DD4B07D0BFC2E26999804B4EAE0075407AD1D7AF8F7F3',
                        address: 'TA37ECJGSNMSCKCPK5KW4UH74QBWZU24QZRUWNA',
                    },
                    vrf: {
                        privateKey: 'AA4FD1C8CBE533CB364101B6CF25DE57DFBF067DDD20B944A91E2045627DA981',
                        publicKey: 'C676A0987DEF74CE5B06FFB34CACFA7AF56BC47A3C3C6580B6D3D593EB4EE4C6',
                        address: 'TCMFERLVMH7JRYY54AAOKEPW6J2VTPVAVAI4GHA',
                    },
                },
            ],
        };

        const restrictedObject = {
            version: 2,
            networkType: 152,
            nemesisGenerationHashSeed: '6C1B92391CCB41C96478471C2634C111D9E989DECD66130C0430B5B8D20117CD',
            privateKeySecurityMode: 'ENCRYPT',
            nodes: [
                {
                    name: 'api-node',
                    friendlyName: 'F718535',
                    roles: 'Peer,Api,Voting',
                    main: {
                        publicKey: 'F71853563BEE2C580C9AFA0A1A84203D14868C19279ABAABF8ADE89AF9AA9B30',
                        address: 'TAEAUXUZOFODY2ZQZGV5DUVQ2TN3HBSXKGBEH5Q',
                    },
                    transport: {
                        publicKey: '41470F3A43095F493319A2241C3059B5EA0ECC89318E6ED32381A4AAEC4D13D1',
                        address: 'TCZARKJGP4RXWWTUZRRYW4X5Z7UQFUXQ5K2VIJQ',
                    },
                    remote: {
                        publicKey: '0C2172A87DC43C02AC381907E865811228BD03E8CF88169BC7DA22B4F9BDD8E6',
                        address: 'TAJUGHLVMRJL6YMBLWOSOOLZGN73CGIRKI3SR5I',
                    },
                    voting: {
                        publicKey: 'DB15D252786AE741CF2DD4B07D0BFC2E26999804B4EAE0075407AD1D7AF8F7F3',
                        address: 'TA37ECJGSNMSCKCPK5KW4UH74QBWZU24QZRUWNA',
                    },
                    vrf: {
                        publicKey: 'C676A0987DEF74CE5B06FFB34CACFA7AF56BC47A3C3C6580B6D3D593EB4EE4C6',
                        address: 'TCMFERLVMH7JRYY54AAOKEPW6J2VTPVAVAI4GHA',
                    },
                },
            ],
        };

        const noPrivateKeyObject = CryptoUtils.removePrivateKeys(object);
        expect(noPrivateKeyObject).deep.eq(restrictedObject);
    });

    it('it removes private keys PROMPT_ALL', () => {
        const object = {
            version: 2,
            networkType: 152,
            anotherPrivateKey: 'abc',
            anotherMainPrivateKey: '123',
            nemesisGenerationHashSeed: '6C1B92391CCB41C96478471C2634C111D9E989DECD66130C0430B5B8D20117CD',
            privateKeySecurityMode: 'ENCRYPT',
            nodes: [
                {
                    name: 'api-node',
                    friendlyName: 'F718535',
                    roles: 'Peer,Api,Voting',
                    main: {
                        privateKey: '6A4E05F63EA94949D1043D59A704CBA1E1FA1F57BF99E41D5F5DCF89E549D4E8',
                        publicKey: 'F71853563BEE2C580C9AFA0A1A84203D14868C19279ABAABF8ADE89AF9AA9B30',
                        address: 'TAEAUXUZOFODY2ZQZGV5DUVQ2TN3HBSXKGBEH5Q',
                    },
                    transport: {
                        privateKey: 'E07C107F25DE9CBBC301683F527EBE05A47572EE810DB91D5C4FA6A7E0B9D5BF',
                        publicKey: '41470F3A43095F493319A2241C3059B5EA0ECC89318E6ED32381A4AAEC4D13D1',
                        address: 'TCZARKJGP4RXWWTUZRRYW4X5Z7UQFUXQ5K2VIJQ',
                    },
                    remote: {
                        privateKey: '6B08368668E3AB32466FCFBC2B6FC0C4A3FB254887FD485DD04DB211992E6B94',
                        publicKey: '0C2172A87DC43C02AC381907E865811228BD03E8CF88169BC7DA22B4F9BDD8E6',
                        address: 'TAJUGHLVMRJL6YMBLWOSOOLZGN73CGIRKI3SR5I',
                    },
                    voting: {
                        privateKey: 'B161B7E2205F0FB577594A47566FA735582997682D99C67B780DB45BD805A4A0',
                        publicKey: 'DB15D252786AE741CF2DD4B07D0BFC2E26999804B4EAE0075407AD1D7AF8F7F3',
                        address: 'TA37ECJGSNMSCKCPK5KW4UH74QBWZU24QZRUWNA',
                    },
                    vrf: {
                        privateKey: 'AA4FD1C8CBE533CB364101B6CF25DE57DFBF067DDD20B944A91E2045627DA981',
                        publicKey: 'C676A0987DEF74CE5B06FFB34CACFA7AF56BC47A3C3C6580B6D3D593EB4EE4C6',
                        address: 'TCMFERLVMH7JRYY54AAOKEPW6J2VTPVAVAI4GHA',
                    },
                },
            ],
        };

        const restrictedObject = {
            version: 2,
            networkType: 152,
            nemesisGenerationHashSeed: '6C1B92391CCB41C96478471C2634C111D9E989DECD66130C0430B5B8D20117CD',
            privateKeySecurityMode: 'ENCRYPT',
            nodes: [
                {
                    name: 'api-node',
                    friendlyName: 'F718535',
                    roles: 'Peer,Api,Voting',
                    main: {
                        publicKey: 'F71853563BEE2C580C9AFA0A1A84203D14868C19279ABAABF8ADE89AF9AA9B30',
                        address: 'TAEAUXUZOFODY2ZQZGV5DUVQ2TN3HBSXKGBEH5Q',
                    },
                    transport: {
                        publicKey: '41470F3A43095F493319A2241C3059B5EA0ECC89318E6ED32381A4AAEC4D13D1',
                        address: 'TCZARKJGP4RXWWTUZRRYW4X5Z7UQFUXQ5K2VIJQ',
                    },
                    remote: {
                        publicKey: '0C2172A87DC43C02AC381907E865811228BD03E8CF88169BC7DA22B4F9BDD8E6',
                        address: 'TAJUGHLVMRJL6YMBLWOSOOLZGN73CGIRKI3SR5I',
                    },
                    voting: {
                        publicKey: 'DB15D252786AE741CF2DD4B07D0BFC2E26999804B4EAE0075407AD1D7AF8F7F3',
                        address: 'TA37ECJGSNMSCKCPK5KW4UH74QBWZU24QZRUWNA',
                    },
                    vrf: {
                        publicKey: 'C676A0987DEF74CE5B06FFB34CACFA7AF56BC47A3C3C6580B6D3D593EB4EE4C6',
                        address: 'TCMFERLVMH7JRYY54AAOKEPW6J2VTPVAVAI4GHA',
                    },
                },
            ],
        };

        const noPrivateKeyObject = CryptoUtils.removePrivateKeysAccordingToSecurityMode(object, PrivateKeySecurityMode.PROMPT_ALL);
        expect(noPrivateKeyObject).deep.eq(restrictedObject);
    });

    it('it removes private keys PROMPT_MAIN', () => {
        const object = {
            version: 2,
            networkType: 152,
            anotherPrivateKey: 'abc',
            anotherMainPrivateKey: '123',
            nemesisGenerationHashSeed: '6C1B92391CCB41C96478471C2634C111D9E989DECD66130C0430B5B8D20117CD',
            privateKeySecurityMode: 'ENCRYPT',
            nodes: [
                {
                    name: 'api-node',
                    friendlyName: 'F718535',
                    roles: 'Peer,Api,Voting',
                    main: {
                        privateKey: '6A4E05F63EA94949D1043D59A704CBA1E1FA1F57BF99E41D5F5DCF89E549D4E8',
                        publicKey: 'F71853563BEE2C580C9AFA0A1A84203D14868C19279ABAABF8ADE89AF9AA9B30',
                        address: 'TAEAUXUZOFODY2ZQZGV5DUVQ2TN3HBSXKGBEH5Q',
                    },
                    transport: {
                        privateKey: 'E07C107F25DE9CBBC301683F527EBE05A47572EE810DB91D5C4FA6A7E0B9D5BF',
                        publicKey: '41470F3A43095F493319A2241C3059B5EA0ECC89318E6ED32381A4AAEC4D13D1',
                        address: 'TCZARKJGP4RXWWTUZRRYW4X5Z7UQFUXQ5K2VIJQ',
                    },
                    remote: {
                        privateKey: '6B08368668E3AB32466FCFBC2B6FC0C4A3FB254887FD485DD04DB211992E6B94',
                        publicKey: '0C2172A87DC43C02AC381907E865811228BD03E8CF88169BC7DA22B4F9BDD8E6',
                        address: 'TAJUGHLVMRJL6YMBLWOSOOLZGN73CGIRKI3SR5I',
                    },
                    voting: {
                        privateKey: 'B161B7E2205F0FB577594A47566FA735582997682D99C67B780DB45BD805A4A0',
                        publicKey: 'DB15D252786AE741CF2DD4B07D0BFC2E26999804B4EAE0075407AD1D7AF8F7F3',
                        address: 'TA37ECJGSNMSCKCPK5KW4UH74QBWZU24QZRUWNA',
                    },
                    vrf: {
                        privateKey: 'AA4FD1C8CBE533CB364101B6CF25DE57DFBF067DDD20B944A91E2045627DA981',
                        publicKey: 'C676A0987DEF74CE5B06FFB34CACFA7AF56BC47A3C3C6580B6D3D593EB4EE4C6',
                        address: 'TCMFERLVMH7JRYY54AAOKEPW6J2VTPVAVAI4GHA',
                    },
                },
            ],
        };

        const restrictedObject = {
            version: 2,
            networkType: 152,
            anotherPrivateKey: 'abc',
            nemesisGenerationHashSeed: '6C1B92391CCB41C96478471C2634C111D9E989DECD66130C0430B5B8D20117CD',
            privateKeySecurityMode: 'ENCRYPT',
            nodes: [
                {
                    name: 'api-node',
                    friendlyName: 'F718535',
                    roles: 'Peer,Api,Voting',
                    main: {
                        publicKey: 'F71853563BEE2C580C9AFA0A1A84203D14868C19279ABAABF8ADE89AF9AA9B30',
                        address: 'TAEAUXUZOFODY2ZQZGV5DUVQ2TN3HBSXKGBEH5Q',
                    },
                    transport: {
                        privateKey: 'E07C107F25DE9CBBC301683F527EBE05A47572EE810DB91D5C4FA6A7E0B9D5BF',
                        publicKey: '41470F3A43095F493319A2241C3059B5EA0ECC89318E6ED32381A4AAEC4D13D1',
                        address: 'TCZARKJGP4RXWWTUZRRYW4X5Z7UQFUXQ5K2VIJQ',
                    },
                    remote: {
                        privateKey: '6B08368668E3AB32466FCFBC2B6FC0C4A3FB254887FD485DD04DB211992E6B94',
                        publicKey: '0C2172A87DC43C02AC381907E865811228BD03E8CF88169BC7DA22B4F9BDD8E6',
                        address: 'TAJUGHLVMRJL6YMBLWOSOOLZGN73CGIRKI3SR5I',
                    },
                    voting: {
                        publicKey: 'DB15D252786AE741CF2DD4B07D0BFC2E26999804B4EAE0075407AD1D7AF8F7F3',
                        address: 'TA37ECJGSNMSCKCPK5KW4UH74QBWZU24QZRUWNA',
                    },
                    vrf: {
                        privateKey: 'AA4FD1C8CBE533CB364101B6CF25DE57DFBF067DDD20B944A91E2045627DA981',
                        publicKey: 'C676A0987DEF74CE5B06FFB34CACFA7AF56BC47A3C3C6580B6D3D593EB4EE4C6',
                        address: 'TCMFERLVMH7JRYY54AAOKEPW6J2VTPVAVAI4GHA',
                    },
                },
            ],
        };

        const noPrivateKeyObject = CryptoUtils.removePrivateKeysAccordingToSecurityMode(object, PrivateKeySecurityMode.PROMPT_MAIN);
        expect(noPrivateKeyObject).deep.eq(restrictedObject);
    });
    it('it removes private keys PROMPT_MAIN_TRANSPORT', () => {
        const object = {
            version: 2,
            networkType: 152,
            anotherPrivateKey: 'abc',
            anotherMainPrivateKey: '123',
            nemesisGenerationHashSeed: '6C1B92391CCB41C96478471C2634C111D9E989DECD66130C0430B5B8D20117CD',
            privateKeySecurityMode: 'ENCRYPT',
            nodes: [
                {
                    name: 'api-node',
                    friendlyName: 'F718535',
                    roles: 'Peer,Api,Voting',
                    main: {
                        privateKey: '6A4E05F63EA94949D1043D59A704CBA1E1FA1F57BF99E41D5F5DCF89E549D4E8',
                        publicKey: 'F71853563BEE2C580C9AFA0A1A84203D14868C19279ABAABF8ADE89AF9AA9B30',
                        address: 'TAEAUXUZOFODY2ZQZGV5DUVQ2TN3HBSXKGBEH5Q',
                    },
                    transport: {
                        privateKey: 'E07C107F25DE9CBBC301683F527EBE05A47572EE810DB91D5C4FA6A7E0B9D5BF',
                        publicKey: '41470F3A43095F493319A2241C3059B5EA0ECC89318E6ED32381A4AAEC4D13D1',
                        address: 'TCZARKJGP4RXWWTUZRRYW4X5Z7UQFUXQ5K2VIJQ',
                    },
                    remote: {
                        privateKey: '6B08368668E3AB32466FCFBC2B6FC0C4A3FB254887FD485DD04DB211992E6B94',
                        publicKey: '0C2172A87DC43C02AC381907E865811228BD03E8CF88169BC7DA22B4F9BDD8E6',
                        address: 'TAJUGHLVMRJL6YMBLWOSOOLZGN73CGIRKI3SR5I',
                    },
                    voting: {
                        privateKey: 'B161B7E2205F0FB577594A47566FA735582997682D99C67B780DB45BD805A4A0',
                        publicKey: 'DB15D252786AE741CF2DD4B07D0BFC2E26999804B4EAE0075407AD1D7AF8F7F3',
                        address: 'TA37ECJGSNMSCKCPK5KW4UH74QBWZU24QZRUWNA',
                    },
                    vrf: {
                        privateKey: 'AA4FD1C8CBE533CB364101B6CF25DE57DFBF067DDD20B944A91E2045627DA981',
                        publicKey: 'C676A0987DEF74CE5B06FFB34CACFA7AF56BC47A3C3C6580B6D3D593EB4EE4C6',
                        address: 'TCMFERLVMH7JRYY54AAOKEPW6J2VTPVAVAI4GHA',
                    },
                },
            ],
        };

        const restrictedObject = {
            version: 2,
            networkType: 152,
            anotherPrivateKey: 'abc',
            nemesisGenerationHashSeed: '6C1B92391CCB41C96478471C2634C111D9E989DECD66130C0430B5B8D20117CD',
            privateKeySecurityMode: 'ENCRYPT',
            nodes: [
                {
                    name: 'api-node',
                    friendlyName: 'F718535',
                    roles: 'Peer,Api,Voting',
                    main: {
                        publicKey: 'F71853563BEE2C580C9AFA0A1A84203D14868C19279ABAABF8ADE89AF9AA9B30',
                        address: 'TAEAUXUZOFODY2ZQZGV5DUVQ2TN3HBSXKGBEH5Q',
                    },
                    transport: {
                        publicKey: '41470F3A43095F493319A2241C3059B5EA0ECC89318E6ED32381A4AAEC4D13D1',
                        address: 'TCZARKJGP4RXWWTUZRRYW4X5Z7UQFUXQ5K2VIJQ',
                    },
                    remote: {
                        privateKey: '6B08368668E3AB32466FCFBC2B6FC0C4A3FB254887FD485DD04DB211992E6B94',
                        publicKey: '0C2172A87DC43C02AC381907E865811228BD03E8CF88169BC7DA22B4F9BDD8E6',
                        address: 'TAJUGHLVMRJL6YMBLWOSOOLZGN73CGIRKI3SR5I',
                    },
                    voting: {
                        publicKey: 'DB15D252786AE741CF2DD4B07D0BFC2E26999804B4EAE0075407AD1D7AF8F7F3',
                        address: 'TA37ECJGSNMSCKCPK5KW4UH74QBWZU24QZRUWNA',
                    },
                    vrf: {
                        privateKey: 'AA4FD1C8CBE533CB364101B6CF25DE57DFBF067DDD20B944A91E2045627DA981',
                        publicKey: 'C676A0987DEF74CE5B06FFB34CACFA7AF56BC47A3C3C6580B6D3D593EB4EE4C6',
                        address: 'TCMFERLVMH7JRYY54AAOKEPW6J2VTPVAVAI4GHA',
                    },
                },
            ],
        };

        const noPrivateKeyObject = CryptoUtils.removePrivateKeysAccordingToSecurityMode(
            object,
            PrivateKeySecurityMode.PROMPT_MAIN_TRANSPORT,
        );
        expect(noPrivateKeyObject).deep.eq(restrictedObject);
    });
});
