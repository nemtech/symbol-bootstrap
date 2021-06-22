# CHANGELOG

All notable changes to this project will be documented in this file.

The changelog format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.8] - NEXT

**Milestone**: Mainnet(1.0.1.0)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v1.0.8  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   The `bootstrap` preset is not the default anymore. The name must be provided via --preset or as a custom preset field. 
-   When upgrading, the --customPreset param is now only required if there is a configuration change, since
    the properties from the original custom preset are fully cached in the target folder.

## [1.0.7] - June-22-2021

**Milestone**: Mainnet(1.0.1.0)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v1.0.7  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Added multi voting key file support.
-   Added `updateVotingKeys` command.

## [1.0.6] - June-8-2021

**Milestone**: Mainnet(1.0.1.0)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v1.0.6  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Catapult Server `1.0.1.0` upgrade.
-   Symbol Rest `2.3.6` upgrade.
-   Reward Program Agent `2.0.0` upgrade.
-   Added `MonitorOnly` reward program.
-   The `link` and `enrollRewardProgram` commands allow `--customPreset` to avoid password prompt when main private key is not stored in the target folder. 
-   Merged tools and server docker images into one.

## [1.0.5] - May-3-2021

**Milestone**: Mainnet(1.0.0.0)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v1.0.5  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Re-enabled node reward program. Upgraded TLS communication.
-   Fixed `failed to load: /docker-entrypoint-initdb.d/mongoDbPrepare.js` when running with root user.
-   Renamed `enrol` to `enroll` for the Rewards Program.

## [1.0.4] - Apr-13-2021

**Milestone**: Mainnet(1.0.0.0)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v1.0.4  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   New `testnet.symboldev.network` testnet!
-   Added `verify` command.
-   Fixed host override when no custom preset is provided in mainnet.
-   Fixed case issue validating keys when creating certificates.
-   Updated Wallet to latest 1.0.1 release.
-   Node properties sinkType: Async and enableSingleThreadPool: false by default in peer nodes too.
-   Dropped NodeJS 10 support. Added Node LTS and Stable Support. 

## [1.0.3] - Mar-31-2021

**Milestone**: Mainnet(1.0.0.0)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v1.0.3  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Improved Custom Preset Object types for symbol bootstrap lib integration.
-   TransactionSelectionStrategy's new default value is `oldest`.

## [1.0.2] - Mar-24-2021

**Milestone**: Mainnet(1.0.0.0)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v1.0.2  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Fixed link (--unlink) command when voting properties changes.
-   Broker ports (7902) are closed by default in compose.
-   Peer role is selected based on `syncsource` configuration and not on the `harvesting` flag.

## [1.0.1] - Mar-22-2021

**Milestone**: Mainnet(1.0.0.0)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v1.0.1  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Random and limited peer/api list.
-   Custom `votingUnfinalizedBlocksDuration` and `nonVotingUnfinalizedBlocksDuration` preset properties.
-   Agent service is disabled until supernode program resumes. 
-   The default `beneficiaryAddress` is the node's main address. Use `beneficiaryAddress: ''` in a custom preset to override the new default.

## [1.0.0] - Mar-16-2021

**Milestone**: Mainnet(1.0.0.0)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v1.0.0  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   **New `mainnet` preset!!!**
-   Removed node from its own `peers-p2p.json` and `peers-api.json` files.
-   Voting keys are ephemeral. They cannot be provided, bootstrap will always generate a new one when resetting the configuration. Bootstrap will never store the voting private key in addresses.yml.
-   Dropped `PROMPT_MAIN_VOTING` from `privateKeySecurityMode`. 
-   Added `PROMPT_MAIN_TRANSPORT` to `privateKeySecurityMode`: The transport/node key will be asked when regenerating the certificates or when upgrading a supernode.
-   Changed server file permission to 0o600

## [0.4.5] - Mar-5-2021

**Milestone**: Hippopotamus(0.10.0.8)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.4.5  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Added `privateKeySecurityMode`. It defines which private keys can be encrypted and stored in the `target/addresses.yml`:
    - `ENCRYPT`: All private keys are encrypted and stored in the target's `addresses.yml` file. Bootstrap will require a password to operate.
    - `PROMPT_MAIN`: Main private keys are not stored in the target's `addresses.yml` file. Bootstrap will request the main private key when certificates are generated, or transactions need to be signed by the `link` and `enrolProgram` commands.
    - `PROMPT_MAIN_VOTING`: Main and voting private keys are not stored in the target's `addresses.yml` file. Bootstrap will request the main private key when certificates are generated, or transactions need to be signed by the `link` and `enrolProgram` commands. The voting private key will be requested when generating the voting key file.
    - `PROMPT_ALL`: No private keys are stored in the in the target's `addresses.yml` file. Bootstrap will request the private keys when they are required by the different commands.
-   The `preset.yml` doesn't contain any private key anymore, encrypted or otherwise.
-   Certificates are not re-generated if not needed when running `--upgrade`. In this case, the main account private key is not required and will not be requested with the `PROMPT` security modes.
-   Voting key files are not re-generated if not needed when running `--upgrade`. In this case, the voting account private key is not required and will not be requested with the `PROMPT_ALL` or `PROMPT_MAIN_VOTING` security modes.
-   Public keys can be used in custom presets in addition to encrypted private keys. If public keys are used, Bootstrap will prompt for the private keys when required.
-   Added `encrypt` and `decrypt` commands to encrypt custom presets and decrypt generated `target/addresses.yml` files:
-   The `--upgrade` param can be used to change the server keys without dropping the data.
-   Splitting `userconfig` into `server-config` and `broker-config` for each service. 
-   Fixed recovery process.

## [0.4.4] - Feb-24-2021

**Milestone**: Hippopotamus(0.10.0.7)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.4.4  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Added `--ready` to `link` and `enrolRewardProgram` commands.
-   Fixed how seed is copied to node folders when `--upgrade` and `resetData` are used
-   Moved Reward Program Agent to its own service/container in docker-compose.yml.

## [0.4.3] - Feb-15-2021

**Milestone**: Hippopotamus(0.10.0.7)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.4.3  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Added Core Dump files when `dockerComposeDebugMode: true`.
-   Added autocomplete support. Try `symbol-bootstrap autocomplete` and follow the instructions (Thanks @44uk).
-   Renamed `supernode` keywords for `rewardProgram` for clarification.  Supernode is a type of Reward Program.
-   Voting is not required to enrol a program.
-   Renamed command from `enrolSupernode` for `enrolRewardProgram`. 
-   Added preset configurable `connectionPoolSize` to the Rest Gateway configuration.
-   Removed Node Key Link transactions from nemesis and `link` command.

## [0.4.2] - Feb-2-2021

**Milestone**: Hippopotamus(0.10.0.6)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.4.2  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Link command supports for `main` multisig accounts.
-   Supernode enrol command supports for `main` multisig accounts.
-   Storing downloaded artifacts (like agent binary) in the current working dir fixing issue when installing bootstrap as root.
-   Moved voting keys files from ./data to ./userconfig in the target folder.
-   Added Symbol Bootstrap version to generated configuration reports.
-   Renamed command from `supernode` for `enrolSupernode`.

## [0.4.1] - Jan-19-2021

**Milestone**: Hippopotamus(0.10.0.5)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.4.1  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Improved --password. It's only required when private keys need to be read.
-   Added `database` service to server and broker `depends_on` compose services.
-   Fixed `link --unlink` command for Voting Key Link transactions.
-   Added multisig account validation to `link` and `supernode` commands.
-   Added `CONTROLLER_PUBLIC_KEY` to Supernode's agent configuration
-   Upgraded Symbol Rest to version 2.3.1.

## [0.4.0] - Jan-14-2021

**Milestone**: Hippopotamus(0.10.0.5)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.4.0  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   **Re track to catapult-server main branch**
-   Compose file version default to 2.4.
-   Fixed mongo memory usage by adding `--wiredTigerCacheSizeGB` limit.
-   Allowing users to exclude custom preset data from a compose service.
-   Basic implementation of supernode program monitoring agent. Supernode Agent installation and supernode enrol command, disabled at present, awaiting full programme implementation, preparatory step.
-   Private key in generated addresses.yml and preset.yml can be encrypted and protected by using --password.
-   Masking 64 hex keys HIDDEN_KEY on log lines.
-   Removed unused Server configuration files in the Rest container. This reduces the risk of exposing config files if the Rest machine gets compromised.

## [0.3.1] - Dec-17-2020

**Milestone**: Hippopotamus(0.10.0.4)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.3.1  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Allowed Bootstrap to run as sudo/root. NOT RECOMMENDED!
-   Added Chmod 777 permission change to the db data folder when running as sudo/root.
-   Increased Rest's DB connection attempts and retries. This avoids Rest shutting down if the DB creation takes longer.
-   Updated Wallet to latest 0.13.6 release

## [0.3.0] - Dec-15-2020

**Milestone**: Hippopotamus(0.10.0.4)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.3.0  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   **New Service:** `Wallet`. Bootstrap private network starts a Wallet service in [http://localhost:80/](http://localhost:80/) when using `--assembly full`. . **Warning:** This wallet service is for demonstration purposes only.
-   **New Service:** `Explorer`. Bootstrap private network starts an Explorer service in [http://localhost:90/](http://localhost:90/) when using `--assembly full`.
-   **New Service:** `Faucet`. Bootstrap private network starts a Faucet service in [http://localhost:100/](http://localhost:100/) when using `--assembly full`.
-   Using remote accounts when setting up nodes by default. This improves security by avoiding main account private keys to be exposed in node configuration (like `harvesterSigningPrivateKey`).
-   Removed unnecessary tls related files once certificates are created.
-   Added addresses.yml migration from old formats.
-   Added --upgrade flag to config, compose and start.
-   Fixed api broker name in testnet's api assembly.
-   Images are not pulled by default speeding up bootstrap and avoiding unexpected alpha server upgrades. To pull new images use `--pullImages`.
-   Testnet Long Voting Key V1 and Short Voting Key V2 support.
-   Added `compose` preset support to inject properties into generated docker-compose services.

## [0.2.1] - 30-Oct-2020

**Milestone**: Hippopotamus(0.10.0.3)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.2.1  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Fixed DB initialization.
-   Added more configurable properties.

## [0.2.0] - 21-Oct-2020

**Milestone**: Hippopotamus(0.10.0.3)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.2.0  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   **[BREAKING CHANGE]** Target folder structure has been changed for scalability. The old target folder needs to be dropped when running this version. Backup the target folder if you need to keep your data!
-   **New Command:** `symbol-bootstrap resetData` cleans the peer data and database without dropping the generated configuration.
-   **New Command:** `symbol-bootstrap healthCheck` tests if the docker compose network is running locally. `--healthCheck` param is allowed in `start` and `run` commands.
-   Allowed `repeat` on a node, a database or a gateway to instantiate them multiple times. This enables you to create large network configurations quickly.
-   Allowed `repeat` in the nemesis block's mosaic list. Harvest currency can be removed with `repeat:0`.
-   Removed preset `light`. Now it's an assembly for the bootstrap preset: `symbol-bootstrap -p bootstrap -a light`.
-   Sink addresses are generated by default.
-   Path properties are now relative folder locations. This improves reusability of the configuration when running the services outside docker compose.
-   Added node type based default configuration simplifying the configuration of nodes in presets.
-   Preset attribute `excludeDockerService: true` allows removing a service from docker-compose.
-   Configurable `trustedHosts` and `localNetworks` in config.
-   Simplified mounted volumes in compose.
-   Allowed multiple databases in compose.
-   Compose's `openPort` now accepts port number.
-   Allowed custom ip address and subnet configuration in compose.
-   Merged `db` and `db-init` services in compose. Now the mongo service knows how to init itself.

## [0.1.1] - 02-Oct-2020

**Milestone**: Hippopotamus(0.10.0.3)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.1.1  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   **New Command:** `symbol-bootstrap link` links the nodes' VRF and Voting keys to an existing network. This simplifies the node registration process to running networks like `testnet`.
-   **New Command:** `symbol-bootstrap report` generates rst and csv files from the configured server properties for documentation. Added `--report` flag to `config` and `start` commands.
-   Fixed default host names in `api` and `peer` in `testnet` preset.
-   The `voting:`, `harvesting:` and `api:` node preset flags define the node's `roles:` setting. There is no need to provide `roles:` attribute anymore.
-   Voting, signing and VRF keys, transactions and tree file are generated and announced when required depending on the node role flags.
-   Added `votingKeyDilution`, `votingKeyStartEpoch` `votingKeyEndEpoch` preset params define to voting key link transaction and tree file.
-   The field `enableDispatcherInputAuditing` is disabled by default saving disk space.
-   Added custom host configuration in docker-compose.
-   Readme and custom preset examples have been improved.
-   Allowing API custom preset object in addition to the file custom yml file.

## [0.1.0] - 26-Sep-2020

**Milestone**: Hippopotamus(0.10.0.3)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.1.0  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   0.10.0.3 catapult server support.
-   2.1.0 rest server support.
-   Improved logging configuration.
-   Allowing custom user when running config time docker images.
-   Renamed param from `--daemon` to `--detached` to keep it in line with docker compose.
-   Added `--service (-s)` to allow starting just one docker service by name.

## [0.0.0] - 14-Sep-2020

**Milestone**: Gorilla.1(0.9.6.4)

| Package          | Version | Link                                                               |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Symbol Bootstrap | v0.0.0  | [symbol-bootstrap](https://www.npmjs.com/package/symbol-bootstrap) |

-   Very first version of the tool!
