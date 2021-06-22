# symbol-bootstrap

Symbol CLI tool that allows you creating, configuring and running Symbol&#39;s complete networks or nodes to be sync with existing networks.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/symbol-bootstrap.svg)](https://npmjs.org/package/symbol-bootstrap)
[![Downloads/week](https://img.shields.io/npm/dw/symbol-bootstrap.svg)](https://npmjs.org/package/symbol-bootstrap)
[![License](https://img.shields.io/npm/l/symbol-bootstrap.svg)](https://github.com/nemtech/symbol-bootstrap/blob/master/package.json)
[![Build Status](https://travis-ci.com/nemtech/symbol-bootstrap.svg?branch=main)](https://travis-ci.com/nemtech/symbol-bootstrap)
[![Coverage Status](https://coveralls.io/repos/github/nemtech/symbol-bootstrap/badge.svg?branch=main)](https://coveralls.io/github/nemtech/symbol-bootstrap?branch=main)
[![Api Doc](https://img.shields.io/badge/api-doc-blue.svg)](https://nemtech.github.io/symbol-bootstrap/)

<!-- toc -->
* [symbol-bootstrap](#symbol-bootstrap)
* [Why this tool?](#why-this-tool)
* [Key benefits:](#key-benefits)
* [Concepts](#concepts)
* [Requirements](#requirements)
* [Usage](#usage)
* [E2E Testing support](#e2e-testing-support)
* [Development](#development)
* [Commands](#commands)
* [Command Topics](#command-topics)
<!-- tocstop -->

# Why this tool?

This tool has been created to address the problems defined in Symbol's [NIP11](https://github.com/nemtech/NIP/blob/main/NIPs/nip-0011.md).

It replaces:

-   [catapult-service-bootstrap](https://github.com/nemtech/catapult-service-bootstrap)
-   [symbol-testnet-bootstrap](https://github.com/nemgrouplimited/symbol-service-bootstrap)

# Key benefits:

-   It's an installable cli tool. It's not a repo you need to clone and compile.
-   The configuration is parametrized via CLI commands and presets instead of by changing properties files.
-   The tools code is unique for any type of network, new networks or nodes in a network. It doesn't need to be copied and pasted in different projects or assemblies.
-   The config command runs on the host machine, not via docker making it easier to debug or tune
-   It's uses the TS SDK for key generation, vrf transactions, address generation instead of using catapult-tools (nemgen is still used to generate the nemesis block).
-   Easier to maintain, the properties files are reused for all nodes, assemblies and network types.
-   Network setup (how many database, nodes, rest gateways to run) is defined in presets, users can provide their own ones.
-   Docker-compose yaml files are generated based on the network setup/preset instead of being manually created/upgraded.
-   The created network (config, nemesis and docker-compose) can be zipped and distributed for other host machines to run it.
-   The used docker images versions can be changed via configuration/preset
-   It uses the [oclif](https://oclif.io) framework. New commands are easy to add and document.
-   It can be included as a npm dependency for clients' e2e testing.

# Concepts

## Preset:

Yaml files that define the configuration and layout of the network and nodes. It defines how many nodes, database, rest gateways, the modes, keys, etc.

Presets are defined at 4 levels from general to specific:

-   Shared: Default configurations for all the networks.
-   Network: It defines the main preset of a given network, example: `bootstrap` or `testnet`.
-   Assembly: It defines a modification of a network, example: `testnet peer`, `tesnet dual`, `testnet api`. Assembly is required for some networks (like `testnet`).
-   Custom: A user provided yml file (`--customPreset` param) that could override some or all properties in the out-of-the-box presets.

Properties in each file override the previous values (by object deep merge).

### Out-of-the-box presets:

-   `-p bootstrap`: Default [preset](https://github.com/nemtech/symbol-bootstrap/blob/main/presets/bootstrap/network.yml). It's a private network with 1 mongo database, 2 peers, 1 api and 1 rest gateway. Nemesis block is generated.
-   `-p bootstrap -a light`: A [light](https://github.com/nemtech/symbol-bootstrap/blob/main/presets/bootstrap/assembly-light.yml) network. It's a version of bootstrap preset with 1 mongo database, 1 dual peer and 1 rest gateway. Great for faster light e2e automatic testing. Nemesis block is generated.
-   `-p bootstrap -a full`: A [full](https://github.com/nemtech/symbol-bootstrap/blob/main/presets/bootstrap/assembly-full.yml) network. The default bootstrap preset plus 1 wallet, 1 explorer and 1 faucet. Great for demonstration purposes. Nemesis block is generated.
-   `-p testnet -a peer`: A [harvesting](https://github.com/nemtech/symbol-bootstrap/blob/main/presets/testnet/assembly-peer.yml) peer node that connects to the current public [testnet](https://github.com/nemtech/symbol-bootstrap/blob/main/presets/testnet/network.yml). [Nemesis block](https://github.com/nemtech/symbol-bootstrap/tree/main/presets/testnet/seed/00000) is copied over.
-   `-p testnet -a api`: A [api](https://github.com/nemtech/symbol-bootstrap/blob/main/presets/testnet/assembly-api.yml) peer node that connects to the current public [testnet](https://github.com/nemtech/symbol-bootstrap/blob/main/presets/testnet/network.yml) running its own mongo database and rest gateway. [Nemesis block](https://github.com/nemtech/symbol-bootstrap/tree/main/presets/testnet/seed/00000) is copied over.
-   `-p testnet -a dual`: A [dual](https://github.com/nemtech/symbol-bootstrap/blob/main/presets/testnet/assembly-dual.yml) haversting peer node that connects to the current public [testnet](https://github.com/nemtech/symbol-bootstrap/blob/main/presets/testnet/network.yml) running its own mongo database and rest gateway. [Nemesis block](https://github.com/nemtech/symbol-bootstrap/tree/main/presets/testnet/seed/00000) is copied over.

### Custom preset:

It's the way you can tune the network without modifying the code. It's a yml file (`--customPreset` param) that could override some or all properties in the out-of-the-box presets.

Custom presets give Symbol Bootstrap its versatility. Check out the custom preset [guides](docs/presetGuides.md)!

## Target:

The folder where the generated config, docker files and data are stored. The folder structure is:

-   `./preset.yml`: the final generated preset.yml that it's used to configure bootstrap, the nodes, docker, etc.
-   `./addresses.yml`: randomly generated data that wasn't provided in the preset. e.g.: SSL keys, nodes' keys, nemesis accounts, generation hash seed, etc.
-   `./nodes`: it holds the configuration, data and logs for all the defined node instances.
-   `./gateways`: it holds the configuration and logs for all the defined node rest gateways.
-   `./nemesis`: The folder used to hold the nemesis block. Block 1 data is generated via `nemgen` tool for new networks. For existing network, it is copied over.
-   `./databases`: the location where the mongo data is stored for the different database instances.
-   `./docker`: the generated docker-compose.yml, mongo init scripts and server basic bash scripts.
-   `./reports`: the location of the generated reports.

# Requirements

-   Node 12.0.0+
-   Docker 18.3.0+
-   Docker Compose 1.25.0+

Validate your environment by running:

```
symbol-bootstrap verify
```

Check your user can run docker without sudo:

```
docker run hello-world
```

If you see an error like:

```
Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock
```

Please follow this [guide](https://www.digitalocean.com/community/questions/how-to-fix-docker-got-permission-denied-while-trying-to-connect-to-the-docker-daemon-socket).

# Usage

It's recommended to run the commands from en empty working dir.

The network configuration, data and docker files will be created inside the target folder ('./target') by default.

```
mkdir my-networks
cd my-networks
```

Once in the working dir:

<!-- usage -->
```sh-session
$ npm install -g symbol-bootstrap
$ symbol-bootstrap COMMAND
running command...
$ symbol-bootstrap (-v|--version|version)
symbol-bootstrap/1.0.8 linux-x64 node-v12.22.1
$ symbol-bootstrap --help [COMMAND]
USAGE
  $ symbol-bootstrap COMMAND
...
```
<!-- usagestop -->

The general usage would be:

```
symbol-bootstrap config -p bootstrap
symbol-bootstrap compose
symbol-bootstrap run
```

You can aggregate all these commands with this one liner:

```
symbol-bootstrap start -p bootstrap
```

If you need to start fresh, you many need to sudo remove the target folder (docker volumes dirs may be created using sudo). Example:

```
sudo rm -rf ./target
```

# E2E Testing support

One use case of this CLI is client E2E testing support. If you are coding a Symbol client, you (Travis or Jenkins) can run e2e tests like:

```
symbol-bootstrap start -p bootstrap --detached
YOUR TEST (e.g: npm run test, gradle test, selenium etc.)
symbol-bootstrap stop
```

`--detached` starts the server waiting until it is up (by polling the network http://localhost:3000/node/health). The command will fail if the components are not up in 30 seconds.

You can also provide your own custom preset (`-c`) if you want your e2e test to start with a specific state (specific balances addresses, mosaics, namespaces, generation hash seed, etc.)

## Node client E2E via CLI:

The CLI can also be used as npm project (dev) dependency (`npm install --save-dev symbol-bootstrap`). Then you can integrate the network to your npm test cycle.
Your `package.json` can look like this:

```yaml

"devDependencies": {
    ....
    "symbol-bootstrap": "0.0.x",
    ....
}

scripts": {
...
    "clean-network": "symbol-bootstrap clean",
    "run-network": "symbol-bootstrap start -c ./output/my_custom_preset.yml --detached --healthCheck",
    "run-stop": "symbol-bootstrap stop",
    "integration-test": "....some mocha/jest/etc tests running against localhost:3000 network....",
    "e2e": "npm run clean-network && npm run run-network && npm run integration-test && npm run stop-network",
...
}
```

Then, you, Jenkins, Travis or your CI tool can run;

```
npm run e2e
```

## Node client E2E via API:

Alternatively, you can use the [BootstrapService](https://github.com/nemtech/symbol-bootstrap/blob/main/src/service/BootstrapService.ts) facade to programmatically start and stop a server.

Example:

```ts
import {BootstrapService, StartParams, Preset} from 'symbol-bootstrap';
import {expect} from '@oclif/test';

it('Bootstrap e2e test', async () => {
    const service = new BootstrapService();
    const config: StartParams = {
        preset: Preset.bootstrap,
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

# Development

If you want to contribute to this tool, clone this repo and run:

```
npm install -g
```

Then, `symbol-bootstrap` runs from the source code. You can now try your features after changing the code.

Pull Requests are appreciated! Please follow the contributing [guidelines](CONTRIBUTING.md).

Note: cloning this repo is only for people that want to tune the tool in a way it cannot be configured. If this is your case, please provide a feature request.
General users should install this tool like any other node module.

# Commands

<!-- commands -->
# Command Topics

* [`symbol-bootstrap autocomplete`](docs/autocomplete.md) - display autocomplete installation instructions
* [`symbol-bootstrap clean`](docs/clean.md) - It removes the target folder deleting the generated configuration and data
* [`symbol-bootstrap compose`](docs/compose.md) - It generates the `docker-compose.yml` file from the configured network.
* [`symbol-bootstrap config`](docs/config.md) - Command used to set up the configuration files and the nemesis block for the current network
* [`symbol-bootstrap decrypt`](docs/decrypt.md) - It decrypts a yml file using the provided password. The source file can be a custom preset file, a preset.yml file or an addresses.yml.
* [`symbol-bootstrap encrypt`](docs/encrypt.md) - It encrypts a yml file using the provided password. The source files would be a custom preset file, a preset.yml file or an addresses.yml.
* [`symbol-bootstrap enrollRewardProgram`](docs/enrollRewardProgram.md) - It enrols the nodes in the rewards program by announcing the enroll transaction to the registration address.  You can also use this command to update the program registration when you change the agent keys (changing the agent-ca-csr) or server host.
* [`symbol-bootstrap healthCheck`](docs/healthCheck.md) - It checks if the services created with docker compose are up and running.
* [`symbol-bootstrap help`](docs/help.md) - display help for symbol-bootstrap
* [`symbol-bootstrap link`](docs/link.md) - It announces VRF and Voting Link transactions to the network for each node with 'Peer' or 'Voting' roles. This command finalizes the node registration to an existing network.
* [`symbol-bootstrap report`](docs/report.md) - it generates reStructuredText (.rst) reports describing the configuration of each node.
* [`symbol-bootstrap resetData`](docs/resetData.md) - It removes the data keeping the generated configuration, certificates, keys and block 1.
* [`symbol-bootstrap run`](docs/run.md) - It boots the network via docker using the generated `docker-compose.yml` file and configuration. The config and compose methods/commands need to be called before this method. This is just a wrapper for the `docker-compose up` bash call.
* [`symbol-bootstrap start`](docs/start.md) - Single command that aggregates config, compose and run in one line!
* [`symbol-bootstrap stop`](docs/stop.md) - It stops the docker-compose network if running (symbol-bootstrap started with --detached). This is just a wrapper for the `docker-compose down` bash call.
* [`symbol-bootstrap updateVotingKeys`](docs/updateVotingKeys.md) - It updates the voting files containing the voting keys when required.
* [`symbol-bootstrap verify`](docs/verify.md) - It tests the installed software in the current computer reporting if there is any missing dependency, invalid version, or software related issue.

<!-- commandsstop -->

```

```
