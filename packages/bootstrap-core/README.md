# symbol-bootstrap-core

Symbol Typescript/Javascript Library that allows you creating, configuring and running Symbol's simple node networks or nodes to be sync with existing networks.

[![Version](https://img.shields.io/npm/v/symbol-bootstrap-core.svg)](https://npmjs.org/package/symbol-bootstrap-core)
[![Downloads/week](https://img.shields.io/npm/dw/symbol-bootstrap-core.svg)](https://npmjs.org/package/symbol-bootstrap-core)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Build Status](https://travis-ci.com/nemtech/symbol-bootstrap.svg?branch=main)](https://travis-ci.com/nemtech/symbol-bootstrap)
[![Coverage Status](https://coveralls.io/repos/github/nemtech/symbol-bootstrap/badge.svg?branch=main)](https://coveralls.io/github/nemtech/symbol-bootstrap?branch=main)
[![Api Doc](https://img.shields.io/badge/api-doc-blue.svg)](https://nemtech.github.io/symbol-bootstrap/)

# Usage

The library can be used by adding the dependency to your Typescript/Javascript project. 

```
$ npm install --save symbol-bootstrap-core
```

Adding the dependency:

```
"dependencies": {
    ....
    "symbol-bootstrap-core": "1.1.x",
    ....
}
```

You can use the [BootstrapService](src/service/BootstrapService.ts) facade to programmatically configure, start and, stop a server.

If you are looking for the CLI tool, please got check out the cli [README](../bootstrap-cli/README.md).

## Node client E2E via API:

The lib can also be used as npm project (dev) dependency (`npm install --save-dev symbol-bootstrap-core`). 

Then you can integrate the network to your npm test cycle.


Example:

```ts
import { BootstrapService, StartParams, Preset, Assembly } from 'symbol-bootstrap';
import { expect } from '@oclif/test'; 

it('Bootstrap e2e test', async () => {
    const service = new BootstrapService();
    const config: StartParams = {
        preset: Preset.dualCurrency,
        assembly: Assembly.multinode,
        reset: true,
        healthCheck: true,
        timeout: 60000 * 5,
        target: 'target/bootstrap-test',
        detached: true,
        user: 'current',
    };
    try {
        await service.stop(config);
        const configResult = await service.start(config);
        expect(configResult.presetData).not.null;
        expect(configResult.addresses).not.null;
        // Here you can write unit tests against a http://localhost:3000 network
    } finally {
        await service.stop(config);
    }
});
```

It's recommended to reuse the same server for multiple tests by using `beforeAll`, `afterAll` kind of statements.
