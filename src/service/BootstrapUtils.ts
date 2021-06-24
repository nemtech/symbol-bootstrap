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

import { spawn } from 'child_process';
import { textSync } from 'figlet';
import {
    createWriteStream,
    existsSync,
    lstatSync,
    promises as fsPromises,
    readdirSync,
    readFileSync,
    rmdirSync,
    statSync,
    unlinkSync,
    writeFileSync,
} from 'fs';
import * as Handlebars from 'handlebars';
import { get } from 'https';
import * as _ from 'lodash';
import { totalmem } from 'os';
import { basename, dirname, join, resolve } from 'path';
import { Convert, DtoMapping, NetworkType } from 'symbol-sdk';
import * as util from 'util';
import { LogType } from '../logger';
import Logger from '../logger/Logger';
import LoggerFactory from '../logger/LoggerFactory';
import { CryptoUtils } from './CryptoUtils';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const version = require('../../package.json').version;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require('js-yaml');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const exec = util.promisify(require('child_process').exec);
const logger: Logger = LoggerFactory.getLogger(LogType.System);

export type Password = string | false | undefined;

export class KnownError extends Error {
    public readonly known = true;
}

/**
 * The operation to migrate the data.
 */
export interface Migration {
    readonly description: string;

    migrate(from: any): any;
}

export class BootstrapUtils {
    public static readonly defaultTargetFolder = 'target';
    public static readonly targetNodesFolder = 'nodes';
    public static readonly targetGatewaysFolder = 'gateways';
    public static readonly targetExplorersFolder = 'explorers';
    public static readonly targetWalletsFolder = 'wallets';
    public static readonly targetDatabasesFolder = 'databases';
    public static readonly targetNemesisFolder = 'nemesis';

    public static readonly CURRENT_USER = 'current';
    private static readonly pulledImages: string[] = [];

    public static readonly VERSION = version;
    public static readonly DEFAULT_ROOT_FOLDER = BootstrapUtils.resolveRootFolder();

    public static stopProcess = false;

    private static onProcessListener = (() => {
        process.on('SIGINT', () => {
            BootstrapUtils.stopProcess = true;
        });
    })();

    public static getFilesRecursively(path: string): string[] {
        const isDirectory = (path: string) => statSync(path).isDirectory();
        const getDirectories = (path: string) =>
            readdirSync(path)
                .map((name) => join(path, name))
                .filter(isDirectory);

        const isFile = (path: string) => statSync(path).isFile();
        const getFiles = (path: string): string[] =>
            readdirSync(path)
                .map((name) => join(path, name))
                .filter(isFile);

        const dirs = getDirectories(path);
        const files = dirs
            .map((dir) => BootstrapUtils.getFilesRecursively(dir)) // go through each directory
            .reduce((a, b) => a.concat(b), []); // map returns a 2d array (array of file arrays) so flatten
        return files.concat(getFiles(path));
    }

    public static async download(
        url: string,
        dest: string,
    ): Promise<{
        downloaded: boolean;
        fileLocation: string;
    }> {
        const destinationSize = existsSync(dest) ? statSync(dest).size : -1;
        const isHttpRequest = url.toLowerCase().startsWith('https:') || url.toLowerCase().startsWith('http:');
        if (!isHttpRequest) {
            const stats = statSync(url);
            if (existsSync(url) && !stats.isDirectory()) {
                return {
                    downloaded: false,
                    fileLocation: url,
                };
            } else {
                throw new Error(`Local file ${url} does not exist`);
            }
        } else {
            logger.info(`Checking remote file ${url}`);
            return new Promise((resolve, reject) => {
                function showDownloadingProgress(received: number, total: number) {
                    const percentage = ((received * 100) / total).toFixed(2);
                    const message = percentage + '% | ' + received + ' bytes downloaded out of ' + total + ' bytes.';
                    BootstrapUtils.logSameLineMessage(message);
                }
                const request = get(url, (response) => {
                    const total = parseInt(response.headers['content-length'] || '0', 10);
                    let received = 0;
                    if (total === destinationSize) {
                        logger.info(`File ${dest} is up to date with url ${url}. No need to download!`);
                        request.abort();
                        resolve({
                            downloaded: false,
                            fileLocation: dest,
                        });
                    } else if (response.statusCode === 200) {
                        existsSync(dest) && unlinkSync(dest);
                        const file = createWriteStream(dest, { flags: 'wx' });
                        logger.info(`Downloading file ${url}. This could take a while!`);
                        response.pipe(file);
                        response.on('data', function (chunk) {
                            received += chunk.length;
                            showDownloadingProgress(received, total);
                        });

                        file.on('finish', () => {
                            resolve({
                                downloaded: true,
                                fileLocation: dest,
                            });
                        });

                        file.on('error', (err) => {
                            file.close();
                            if (err.code === 'EEXIST') {
                                reject(new Error('File already exists'));
                            } else {
                                unlinkSync(dest); // Delete temp file
                                reject(err);
                            }
                        });
                    } else {
                        reject(new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`));
                    }
                });

                request.on('error', (err) => {
                    existsSync(dest) && unlinkSync(dest); // Delete temp file
                    reject(err.message);
                });
            });
        }
    }

    public static logSameLineMessage(message: string): void {
        process.stdout.write(BootstrapUtils.isWindows() ? '\x1b[0G' : '\r');
        process.stdout.write(message);
    }

    public static deleteFolder(folder: string, excludeFiles: string[] = []): void {
        if (existsSync(folder)) {
            logger.info(`Deleting folder ${folder}`);
        }
        return BootstrapUtils.deleteFolderRecursive(folder, excludeFiles);
    }

    private static deleteFolderRecursive(folder: string, excludeFiles: string[] = []): void {
        if (existsSync(folder)) {
            readdirSync(folder).forEach((file: string) => {
                const currentPath = join(folder, file);
                if (excludeFiles.find((f) => f === currentPath)) {
                    logger.info(`File ${currentPath} excluded from deletion.`);
                    return;
                }
                if (lstatSync(currentPath).isDirectory()) {
                    // recurse
                    this.deleteFolderRecursive(
                        currentPath,
                        excludeFiles.map((file) => join(currentPath, file)),
                    );
                } else {
                    // delete file
                    unlinkSync(currentPath);
                }
            });
            if (!readdirSync(folder).length) rmdirSync(folder);
        }
    }

    public static deleteFile(file: string): void {
        if (existsSync(file) && lstatSync(file).isFile()) {
            unlinkSync(file);
        }
    }

    public static showBanner(): void {
        console.log(textSync('symbol-bootstrap', { horizontalLayout: 'fitted' }));
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public static validateIsDefined(value: any, message: string): void {
        if (value === undefined || value === null) {
            throw new Error(message);
        }
    }

    public static validateIsTrue(value: boolean, message: string): void {
        if (!value) {
            throw new Error(message);
        }
    }

    public static async pullImage(image: string): Promise<void> {
        this.validateIsDefined(image, 'Image must be provided');
        if (BootstrapUtils.pulledImages.indexOf(image) > -1) {
            return;
        }
        try {
            logger.info(`Pulling image ${image}`);
            const stdout = await this.spawn('docker', ['pull', image], true, `${image} `);
            const outputLines = stdout.toString().split('\n');
            logger.info(`Image pulled: ${outputLines[outputLines.length - 2]}`);
            BootstrapUtils.pulledImages.push(image);
        } catch (e) {
            logger.warn(`Image ${image} could not be pulled!`);
        }
    }

    public static resolveRootFolder(): string {
        const rootFolder = resolve(__dirname, '../..');
        if (!existsSync(join(rootFolder, 'presets', 'shared.yml'))) {
            throw new Error(`Root Folder ${rootFolder} does not look right!`);
        }
        return rootFolder;
    }

    public static async runImageUsingExec({
        catapultAppFolder,
        image,
        userId,
        workdir,
        cmds,
        binds,
    }: {
        catapultAppFolder?: string;
        image: string;
        userId?: string;
        workdir?: string;
        cmds: string[];
        binds: string[];
    }): Promise<{ stdout: string; stderr: string }> {
        const volumes = binds.map((b) => `-v ${b}`).join(' ');
        const userParam = userId ? `-u ${userId}` : '';
        const workdirParam = workdir ? `--workdir=${workdir}` : '';
        const environmentParam = catapultAppFolder ? `--env LD_LIBRARY_PATH=${catapultAppFolder}/lib:${catapultAppFolder}/deps` : '';
        const runCommand = `docker run --rm ${userParam} ${workdirParam} ${environmentParam} ${volumes} ${image} ${cmds
            .map((a) => `"${a}"`)
            .join(' ')}`;
        logger.info(BootstrapUtils.secureString(`Running image using Exec: ${image} ${cmds.join(' ')}`));
        return await this.exec(runCommand);
    }

    public static toAns1(privateKey: string): string {
        const prefix = '302e020100300506032b657004220420';
        return `${prefix}${privateKey.toLowerCase()}`;
    }

    public static secureString(text: string): string {
        const regex = new RegExp('[0-9a-fA-F]{64}', 'g');
        return text.replace(regex, 'HIDDEN_KEY');
    }

    public static sleep(ms: number): Promise<any> {
        // Create a promise that rejects in <ms> milliseconds
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    public static poll(promiseFunction: () => Promise<boolean>, totalPollingTime: number, pollIntervalMs: number): Promise<boolean> {
        const startTime = new Date().getMilliseconds();
        return promiseFunction().then(async (result) => {
            if (result) {
                return true;
            } else {
                if (BootstrapUtils.stopProcess) {
                    return Promise.resolve(false);
                }
                const endTime = new Date().getMilliseconds();
                const newPollingTime: number = Math.max(totalPollingTime - pollIntervalMs - (endTime - startTime), 0);
                if (newPollingTime) {
                    logger.info(`Retrying in ${pollIntervalMs / 1000} seconds. Polling will stop in ${newPollingTime / 1000} seconds`);
                    await BootstrapUtils.sleep(pollIntervalMs);
                    return this.poll(promiseFunction, newPollingTime, pollIntervalMs);
                } else {
                    return false;
                }
            }
        });
    }

    public static async generateConfiguration(
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        templateContext: any,
        copyFrom: string,
        copyTo: string,
        excludeFiles: string[] = [],
        includeFiles: string[] = [],
    ): Promise<void> {
        // Loop through all the files in the config folder
        await fsPromises.mkdir(copyTo, { recursive: true });
        const files = await fsPromises.readdir(copyFrom);
        await Promise.all(
            files.map(async (file: string) => {
                const fromPath = join(copyFrom, file);
                const toPath = join(copyTo, file);

                // Stat the file to see if we have a file or dir
                const stat = await fsPromises.stat(fromPath);
                if (stat.isFile()) {
                    const isMustache = file.indexOf('.mustache') > -1;
                    const destinationFile = toPath.replace('.mustache', '');
                    const fileName = basename(destinationFile);
                    const notBlacklisted = excludeFiles.indexOf(fileName) === -1;
                    const inWhitelistIfAny = includeFiles.length === 0 || includeFiles.indexOf(fileName) > -1;
                    if (notBlacklisted && inWhitelistIfAny) {
                        if (isMustache) {
                            const template = await BootstrapUtils.readTextFile(fromPath);
                            const renderedTemplate = this.runTemplate(template, templateContext);

                            await fsPromises.writeFile(
                                destinationFile,
                                destinationFile.toLowerCase().endsWith('.json')
                                    ? BootstrapUtils.formatJson(renderedTemplate)
                                    : renderedTemplate,
                            );
                        } else {
                            await fsPromises.copyFile(fromPath, destinationFile);
                        }
                        await fsPromises.chmod(destinationFile, 0o600);
                    }
                } else if (stat.isDirectory()) {
                    await fsPromises.mkdir(toPath, { recursive: true });
                    await this.generateConfiguration(templateContext, fromPath, toPath, excludeFiles, includeFiles);
                }
            }),
        );
    }

    public static async chmodRecursive(path: string, mode: string | number): Promise<void> {
        // Loop through all the files in the config folder
        const stat = await fsPromises.stat(path);
        if (stat.isFile()) {
            await fsPromises.chmod(path, mode);
        } else if (stat.isDirectory()) {
            const files = await fsPromises.readdir(path);
            await Promise.all(
                files.map(async (file: string) => {
                    await this.chmodRecursive(join(path, file), mode);
                }),
            );
        }
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public static runTemplate(template: string, templateContext: any): string {
        const compiledTemplate = Handlebars.compile(template);
        return compiledTemplate(templateContext);
    }

    public static async mkdir(path: string): Promise<void> {
        await fsPromises.mkdir(path, { recursive: true });
    }

    public static async mkdirParentFolder(fileName: string): Promise<void> {
        const parentFolder = dirname(fileName);
        if (parentFolder) {
            await BootstrapUtils.mkdir(parentFolder);
        }
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public static async writeYaml(path: string, object: any, password: string | undefined): Promise<void> {
        const yamlString = this.toYaml(password ? CryptoUtils.encrypt(object, BootstrapUtils.validatePassword(password)) : object);
        await BootstrapUtils.writeTextFile(path, yamlString);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public static pruneEmpty(obj: any): any {
        return (function prune(current: any) {
            _.forOwn(current, (value, key) => {
                if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value) || (_.isObject(value) && _.isEmpty(prune(value)))) {
                    delete current[key];
                }
            });
            // remove any leftover undefined values from the delete
            // operation on an array
            if (_.isArray(current)) _.pull(current, undefined);

            return current;
        })(_.cloneDeep(obj)); // Do not modify the original object, create a clone instead
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public static toYaml(object: any): string {
        return yaml.safeDump(object, { skipInvalid: true, indent: 4, lineWidth: 140, noRefs: true });
    }

    public static fromYaml(yamlString: string): any {
        return yaml.safeLoad(yamlString);
    }

    public static loadYaml(fileLocation: string, password: Password): any {
        const object = this.fromYaml(this.loadFileAsText(fileLocation));
        if (password) {
            BootstrapUtils.validatePassword(password);
            try {
                return CryptoUtils.decrypt(object, password);
            } catch (e) {
                throw new KnownError(`Cannot decrypt file ${fileLocation}. Have you used the right password?`);
            }
        } else {
            if (password !== false && CryptoUtils.encryptedCount(object) > 0) {
                throw new KnownError(
                    `File ${fileLocation} seems to be encrypted but no password has been provided. Have you entered the right password?`,
                );
            }
        }
        return object;
    }

    public static loadFileAsText(fileLocation: string): string {
        return readFileSync(fileLocation, 'utf8');
    }

    public static async writeTextFile(path: string, text: string): Promise<void> {
        await BootstrapUtils.mkdirParentFolder(path);
        await fsPromises.writeFile(path, text, 'utf8');
    }

    public static async readTextFile(path: string): Promise<string> {
        return await fsPromises.readFile(path, 'utf8');
    }

    private static dockerUserId: string;

    public static async resolveDockerUserFromParam(paramUser: string | undefined): Promise<string | undefined> {
        if (!paramUser || paramUser.trim() === '') {
            return undefined;
        }
        if (paramUser === BootstrapUtils.CURRENT_USER) {
            return BootstrapUtils.getDockerUserGroup();
        }
        return paramUser;
    }
    public static async createImageUsingExec(targetFolder: string, dockerFile: string, tag: string): Promise<string> {
        const runCommand = `docker build -f ${dockerFile} ${targetFolder} -t ${tag}`;
        logger.info(`Creating image image '${tag}' from ${dockerFile}`);
        return (await this.exec(runCommand)).stdout;
    }

    public static async exec(runCommand: string): Promise<{ stdout: string; stderr: string }> {
        logger.debug(`Exec command: ${runCommand}`);
        const { stdout, stderr } = await exec(runCommand);
        return { stdout, stderr };
    }

    public static async spawn(command: string, args: string[], useLogger: boolean, logPrefix = ''): Promise<string> {
        const cmd = spawn(command, args);
        return new Promise<string>((resolve, reject) => {
            logger.info(`Spawn command: ${command} ${args.join(' ')}`);
            let logText = useLogger ? '' : 'Check console for output....';
            const log = (data: string, isError: boolean) => {
                if (useLogger) {
                    logText = logText + `${data}\n`;
                    if (isError) logger.warn(BootstrapUtils.secureString(logPrefix + data));
                    else logger.info(BootstrapUtils.secureString(logPrefix + data));
                } else {
                    console.log(logPrefix + data);
                }
            };

            cmd.stdout.on('data', (data) => {
                log(`${data}`.trim(), false);
            });

            cmd.stderr.on('data', (data) => {
                log(`${data}`.trim(), true);
            });

            cmd.on('error', (error) => {
                log(`${error.message}`.trim(), true);
            });

            cmd.on('exit', (code, signal) => {
                if (code) {
                    log(`Process exited with code ${code} and signal ${signal}`, true);
                    reject(logText);
                } else {
                    resolve(logText);
                }
            });

            cmd.on('close', (code) => {
                if (code) {
                    log(`Process closed with code ${code}`, true);
                    reject(logText);
                } else {
                    resolve(logText);
                }
            });

            process.on('SIGINT', () => {
                resolve(logText);
            });
        });
    }

    public static async getDockerUserGroup(): Promise<string> {
        const isWin = this.isWindows();
        if (isWin) {
            return '';
        }
        if (BootstrapUtils.dockerUserId !== undefined) {
            return BootstrapUtils.dockerUserId;
        }
        try {
            const userId = process?.getuid();
            const groupId = process?.getgid();
            const user = `${userId}:${groupId}`;
            logger.info(`User for docker resolved: ${user}`);
            if (userId === 0) {
                logger.error('YOU ARE RUNNING BOOTSTRAP AS ROOT!!!! THIS IS NOT RECOMMENDED!!!');
            }
            BootstrapUtils.dockerUserId = user;
            return user;
        } catch (e) {
            logger.info(`User for docker could not be resolved: ${e}`);
            return '';
        }
    }

    public static isRoot(): boolean {
        return !this.isWindows() && process?.getuid() === 0;
    }

    public static isWindows(): boolean {
        return process.platform === 'win32';
    }

    public static validateFolder(workingDirFullPath: string): void {
        if (!existsSync(workingDirFullPath)) {
            throw new Error(`${workingDirFullPath} folder does not exist`);
        }
        if (!lstatSync(workingDirFullPath).isDirectory()) {
            throw new Error(`${workingDirFullPath} is not a folder!`);
        }
    }

    public static getTargetFolder(target: string, absolute: boolean, ...paths: string[]): string {
        if (absolute) {
            return join(process.cwd(), target, ...paths);
        } else {
            return join(target, ...paths);
        }
    }

    public static getTargetNodesFolder(target: string, absolute: boolean, ...paths: string[]): string {
        return this.getTargetFolder(target, absolute, this.targetNodesFolder, ...paths);
    }

    public static getTargetGatewayFolder(target: string, absolute: boolean, ...paths: string[]): string {
        return this.getTargetFolder(target, absolute, this.targetGatewaysFolder, ...paths);
    }

    public static getTargetNemesisFolder(target: string, absolute: boolean, ...paths: string[]): string {
        return this.getTargetFolder(target, absolute, this.targetNemesisFolder, ...paths);
    }

    public static getTargetDatabasesFolder(target: string, absolute: boolean, ...paths: string[]): string {
        return this.getTargetFolder(target, absolute, this.targetDatabasesFolder, ...paths);
    }

    //HANDLEBARS READY FUNCTIONS:
    private static initialize = (() => {
        Handlebars.registerHelper('toAmount', BootstrapUtils.toAmount);
        Handlebars.registerHelper('toHex', BootstrapUtils.toHex);
        Handlebars.registerHelper('toSimpleHex', BootstrapUtils.toSimpleHex);
        Handlebars.registerHelper('toSeconds', BootstrapUtils.toSeconds);
        Handlebars.registerHelper('toJson', BootstrapUtils.toJson);
        Handlebars.registerHelper('splitCsv', BootstrapUtils.splitCsv);
        Handlebars.registerHelper('add', BootstrapUtils.add);
        Handlebars.registerHelper('minus', BootstrapUtils.minus);
        Handlebars.registerHelper('computerMemory', BootstrapUtils.computerMemory);
    })();

    private static add(a: any, b: any): string | number {
        if (_.isNumber(a) && _.isNumber(b)) {
            return Number(a) + Number(b);
        }
        if (typeof a === 'string' && typeof b === 'string') {
            return a + b;
        }
        return '';
    }

    private static minus(a: any, b: any): number {
        if (!_.isNumber(a)) {
            throw new TypeError('expected the first argument to be a number');
        }
        if (!_.isNumber(b)) {
            throw new TypeError('expected the second argument to be a number');
        }
        return Number(a) - Number(b);
    }

    public static computerMemory(percentage: number): number {
        return (totalmem() * percentage) / 100;
    }

    public static toAmount(renderedText: string | number): string {
        const numberAsString = (renderedText + '').split("'").join('');
        if (!numberAsString.match(/^\d+$/)) {
            throw new Error(`'${renderedText}' is not a valid integer`);
        }
        return (numberAsString.match(/\d{1,3}(?=(\d{3})*$)/g) || [numberAsString]).join("'");
    }

    public static toHex(renderedText: string): string {
        const numberAsString = BootstrapUtils.toSimpleHex(renderedText);
        return '0x' + (numberAsString.match(/\w{1,4}(?=(\w{4})*$)/g) || [numberAsString]).join("'");
    }
    public static toSimpleHex(renderedText: string): string {
        return renderedText.toString().split("'").join('').replace(/^(0x)/, '');
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public static toJson(object: any): string {
        return JSON.stringify(object, null, 2);
    }

    public static formatJson(string: string): string {
        // Validates and format the json string.
        return JSON.stringify(JSON.parse(string), null, 2);
    }

    public static splitCsv(object: string): string[] {
        return (object || '').split(',').map((c) => c.trim());
    }

    public static toSeconds(serverDuration: string): number {
        return DtoMapping.parseServerDuration(serverDuration).seconds();
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public static migrate<T extends { version?: number }>(entityName: string, versioned: T, migrations: Migration[] = []): T {
        if (!versioned) {
            return versioned;
        }
        const currentVersion = migrations.length + 1;
        versioned.version = versioned.version || 1;

        if (versioned.version == currentVersion) {
            return versioned;
        }
        logger.info(`Migrating object ${entityName} from version ${versioned.version} to version ${currentVersion}`);
        if (versioned.version > currentVersion) {
            throw new Error(`Current data version is ${versioned.version} but higher version is ${currentVersion}`);
        }
        const migratedVersioned = migrations.slice(versioned.version - 1).reduce((toMigrateData, migration) => {
            if (toMigrateData === undefined) {
                logger.info(`data to migrate is undefined, ignoring migration ${migration.description}`);
                return undefined;
            }
            logger.info(`Applying migration ${migration.description}`);
            return migration.migrate(toMigrateData);
        }, versioned);
        migratedVersioned.version = currentVersion;
        logger.info(`Object ${entityName} migrated to version ${currentVersion}`);
        return migratedVersioned;
    }

    public static getNetworkIdentifier(networkType: NetworkType): string {
        switch (networkType) {
            case NetworkType.MAIN_NET:
                return 'public';
            case NetworkType.TEST_NET:
                return 'public-test';
            case NetworkType.MIJIN:
                return 'mijin';
            case NetworkType.MIJIN_TEST:
                return 'mijin-test';
            case NetworkType.PRIVATE:
                return 'private';
            case NetworkType.PRIVATE_TEST:
                return 'private-test';
        }
        throw new Error(`Invalid Network Type ${networkType}`);
    }

    public static getNetworkName(networkType: NetworkType): string {
        switch (networkType) {
            case NetworkType.MAIN_NET:
                return 'public';
            case NetworkType.TEST_NET:
                return 'publicTest';
            case NetworkType.MIJIN:
                return 'mijin';
            case NetworkType.MIJIN_TEST:
                return 'mijinTest';
            case NetworkType.PRIVATE:
                return 'private';
            case NetworkType.PRIVATE_TEST:
                return 'privateTest';
        }
        throw new Error(`Invalid Network Type ${networkType}`);
    }

    static createDerFile(privateKey: string, file: string): void {
        writeFileSync(file, Convert.hexToUint8(BootstrapUtils.toAns1(privateKey)));
    }

    public static validatePassword(password: string): string {
        const passwordMinSize = 4;
        if (password.length < passwordMinSize) {
            throw new KnownError(`Password is too short. It should have at least ${passwordMinSize} characters!`);
        }
        return password;
    }
}
