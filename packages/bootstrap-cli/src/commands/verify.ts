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

import { Command } from '@oclif/command';
import { Logger, LoggerFactory, LogType, VerifyService } from 'symbol-bootstrap-core';
import { CommandUtils } from '../service';
const logger: Logger = LoggerFactory.getLogger(LogType.System);

export default class Verify extends Command {
    static description =
        'It tests the installed software in the current computer reporting if there is any missing dependency, invalid version, or software related issue.';
    static examples = [`$ symbol-bootstrap verify`];

    static flags = {
        help: CommandUtils.helpFlag,
    };

    public async run(): Promise<void> {
        CommandUtils.showBanner();
        const report = await new VerifyService().createReport();
        logger.info(`OS: ${report.platform}`);
        report.lines.forEach((line) => {
            if (line.recommendation) {
                logger.warn(`${line.header}  - Warning! - ${line.message} - ${line.recommendation}`);
            } else {
                logger.info(`${line.header} - OK! - ${line.message}`);
            }
        });
    }
}
