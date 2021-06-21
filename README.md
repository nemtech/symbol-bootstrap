# symbol-bootstrap

Welcome to Symbol's Bootstrap libraries and tools.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/symbol-bootstrap.svg)](https://npmjs.org/package/symbol-bootstrap)
[![Downloads/week](https://img.shields.io/npm/dw/symbol-bootstrap.svg)](https://npmjs.org/package/symbol-bootstrap)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Build Status](https://travis-ci.com/nemtech/symbol-bootstrap.svg?branch=main)](https://travis-ci.com/nemtech/symbol-bootstrap)
[![Coverage Status](https://coveralls.io/repos/github/nemtech/symbol-bootstrap/badge.svg?branch=main)](https://coveralls.io/github/nemtech/symbol-bootstrap?branch=main)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![Api Doc](https://img.shields.io/badge/api-doc-blue.svg)](https://nemtech.github.io/symbol-bootstrap/)

The solution is split in 2 main products.

-   **Bootstrap:** To create and manage individual Symbol nodes for existing or new simple networks.
-   **Network:** To create and manage "clusters" of Symbol nodes for existing or new networks.

Each solution has a "core" library version, and a cli tool. Most people would use the cli tool but if you want to code your own Typescript/Javascript solution you can depend on the "core" libraries.

## Symbol Bootstrap CLI

The **classic CLI** solution to configure and manage single nodes. It's the cli of the `symbol-bootstrap-core` module.

### When to use this package?

-   If you are new to Symbol and want to run and manage your first node. [**Start here!**](./packages/bootstrap-cli)
-   If you are creating a running a single node connected to a known public network (Testnet, Mainnet) or a private network.
-   To create an individual private network node for demonstration purposes.
-   For general e2e tests where you are not using Typescript/Javascript, or you just want to run a network with bash scripts.
-   To quickly run your own Web Wallet, Faucet or Explorer services.

Find more in the [bootstrap-cli](packages/bootstrap-cli) submodule.

## Symbol Network CLI

Cli tool to create and manage clusters of nodes. It's the cli of the `symbol-network-core` module. The cli tool handles the creation and distribution of the nemesis block when creating a new multinode deployment network.

### When to use this package?

-   If you are creating your own private network with multiple independent nodes, a second Testnet, or Devnet from scratch.
-   If you are creating a cluster of nodes for an existing network like Mainnet, Testnet or any other existing Private Network.

Find more in the [network-cli](packages/network-cli) submodule.

## Symbol Bootstrap Core

Library to create and manage individual Symbol nodes.

### When to use this package?

-   If you are coding your own configurator or deployment solution in Typescript/Javascript.
-   For Typescript/Javascript e2e tests where your test cases configure and run a Symbol node to work with.

Find more in the [bootstrap-core](packages/bootstrap-core) submodule.

## Symbol Network Core

Library to create and manage clusters of Symbol nodes. The library handles the creation and distribution of the nemesis block when creating a new multinode deployment network.

### When to use this package?

-   If you are coding your own cluster configuration and deployment solution in Typescript/Javascript. One example could be a UI application for creation and deployment of Symbol networks.

Find more in the [network-core](packages/network-core) submodule.

# Contributing

Please read our [contribution guidelines](./CONTRIBUTING.md) before getting started.

Note: cloning this repo is only for people that want to tune the tools and libraries in a way it cannot be configured. If this is your case, please provide a feature request.
General users should install the tools and libraries like any other node module.

## Requirements

-   Node 12.0.0+
-   Docker 18.3.0+
-   Docker Compose 1.25.0+

This repository is a multimodule/singlerepo project powered by [Lerna](https://github.com/lerna/lerna).

## Install dependencies

```
npm run init
```

## Build

Build all packages

```bash
npm run build
```

### Watch

Watch all packages change. Very useful during development to build only file that changes:

```bash
npm run watch
```

### Lint

Fix style and lint for all packages

```bash
npm run style:fix
```

### Run Tests

First of all, this ensures the libraries are correctly building, and passing lint and prettier:

```
npm run test
```

### Install the symbol-bootstrap cli tool from source code

```
cd package/bootstrap-cli
npm install -g
```

Then, `symbol-bootstrap` runs from the source code. You can now try your features after changing the code.

### Install the symbol-network cli tool from source code

```
cd package/network-cli
npm install -g
```

Then, `symbol-network` runs from the source code. You can now try your features after changing the code.
