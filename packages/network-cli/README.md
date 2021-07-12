# symbol-network

CLI tools to create node clusters for new or existing networks. This cli handles the creation and distribution of the nemesis block.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/symbol-network.svg)](https://npmjs.org/package/symbol-network)
[![Downloads/week](https://img.shields.io/npm/dw/symbol-network.svg)](https://npmjs.org/package/symbol-network)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Build Status](https://travis-ci.com/nemtech/symbol-bootstrap.svg?branch=main)](https://travis-ci.com/nemtech/symbol-bootstrap)
[![Coverage Status](https://coveralls.io/repos/github/nemtech/symbol-bootstrap/badge.svg?branch=main)](https://coveralls.io/github/nemtech/symbol-bootstrap?branch=main)
[![Api Doc](https://img.shields.io/badge/api-doc-blue.svg)](../../)

<!-- toc -->
* [symbol-network](#symbol-network)
* [Why this tool?](#why-this-tool)
* [Requirements](#requirements)
* [Installation](#installation)
* [Usage](#usage)
* [Commands](#commands)
* [Command Topics](#command-topics)
* [Development](#development)
<!-- tocstop -->

# Why this tool?

To handle dozens or hundreds of Symbol Nodes in "cattle" style, where nodes are created and managed in bundles.

If you are creating a Symbol node for the first time, please have look at the [symbol-bootstrap](../bootstrap-cli) cli.

# Requirements

-   Node 12.0.0+
-   Docker 18.3.0+
-   Docker Compose 1.25.0+
-   Symbol Bootstrap 1.1.0+.

# Installation

Before installing this tool, you need to install the symbol-bootstrap cli first. 
Please follow the Please follow the [instructions](../bootstrap-cli/README.md#installation).

It's recommended to run the commands from en empty working dir.

<!-- usage -->
```sh-session
$ npm install -g symbol-network
$ symbol-network COMMAND
running command...
$ symbol-network (-v|--version|version)
symbol-network/0.0.1-alpha.0 linux-x64 node-v12.22.1
$ symbol-network --help [COMMAND]
USAGE
  $ symbol-network COMMAND
...
```
<!-- usagestop -->

# Usage

After installing the tool. Run:

```sh-session
$ mkdir my-network-workspace
$ cd my-network-workspace
$ symbol-network init

```

and follow the instructions.

The wizard style CLI will guide you in the process of creating the nodes. The tool creates a bunch of files and folders.

When creating nodes to an existing network the files and folders are: 

-   `network-input.yml`: This file is created by the `symbol-network init`. It generates and defines the initial node layout, describing how many nodes of each type you want to create.
-   `network.yml`: This file is created by the `symbol-network expandNodes` and mantained by the following commands. It's the "expansion" of `network-input.yml` file where each node layed out individually. It defines your node cluster.
-   `nodes`: The folder that contains the final node configurations ready to deploy. The folder is created and maintained by the `symbol-network configureNodes` command.
-   `local-storage.yml`: A file that stores the private keys and voting key files of the nodes. This file is created by the default private data storage. This can be extended to store data somewhere else, like for example AWS Secrets.

In addition, for new networks, the you sill see the following files and folders are:

-   `custom-network-preset.yml`: This files defines the configuration of it. It's the "--preset mainnet/testnet" for your new network. You can share this file with other members that want to connect to your new private network.
-   `nemesis-target`: The target of the nemesis node. You can use this initial node to try the network before deploying the final nodes. The generated nemesis seed can be shared with other members that want to connect to your network. 

# Commands

<!-- commands -->
# Command Topics

* [`symbol-network autocomplete`](docs/autocomplete.md) - display autocomplete installation instructions
* [`symbol-network configureNodes`](docs/configureNodes.md) - This is the last step of the node cluster setup that generates and updates each node's configuration.
* [`symbol-network displayResolvedNetworkPreset`](docs/displayResolvedNetworkPreset.md) - It displays the resolved network preset (Bootstrap's shared + custom-network-preset.yml).
* [`symbol-network expandNodes`](docs/expandNodes.md) - This "one-time" command is the second step configuring the node cluster for an existing an network or a new network.
* [`symbol-network generateNemesis`](docs/generateNemesis.md) - This "one-time" command is the third step when creating a new network after running the "expandNodes" command.
* [`symbol-network healthCheck`](docs/healthCheck.md) - It health checks the nodes of the network once the network is running by performing several remote tests.
* [`symbol-network help`](docs/help.md) - display help for symbol-network
* [`symbol-network init`](docs/init.md) - This command is the first step configuring the node cluster for an existing an network or a new network.

<!-- commandsstop -->

# Development

If you want to contribute to this tool, clone this repo, and run:

```
npm run init
npm run build
cd package/network-cli
npm install -g
```

Then, `symbol-bootstrap` runs from the source code. You can now try your features after changing the code.

Pull Requests are appreciated! Please follow the contributing [guidelines](../../CONTRIBUTING.md).

Note: cloning this repo is only for people that want to tune the tool in a way it cannot be configured. If this is your case, please provide a feature request.

General users should install this tool like any other node module.
