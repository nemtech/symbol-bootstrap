`symbol-bootstrap config`
=========================

Command used to set up the configuration files and the nemesis block for the current network

* [`symbol-bootstrap config`](#symbol-bootstrap-config)

## `symbol-bootstrap config`

Command used to set up the configuration files and the nemesis block for the current network

```
USAGE
  $ symbol-bootstrap config

OPTIONS
  -a, --assembly=assembly                   The assembly that define the node(s) layout. It can be provided via custom
                                            preset or cli parameter. If not provided, the value is resolved from the
                                            target/preset.yml file.

  -c, --customPreset=customPreset           External preset file. Values in this file will override the provided
                                            presets.

  -h, --help                                It shows the help of this command.

  -p, --preset=(bootstrap|testnet|mainnet)  The network preset. It can be provided via custom preset or cli parameter.
                                            If not provided, the value is resolved from the target/preset.yml file.

  -r, --reset                               It resets the configuration generating a new one.

  -t, --target=target                       [default: target] The target folder where the symbol-bootstrap network is
                                            generated

  -u, --user=user                           [default: current] User used to run docker images when creating
                                            configuration files like certificates or nemesis block. "current" means the
                                            current user.

  --noPassword                              When provided, Bootstrap will not use a password, so private keys will be
                                            stored in plain text. Use with caution.

  --password=password                       A password used to encrypt and decrypt private keys in preset files like
                                            addresses.yml and preset.yml. Bootstrap prompts for a password by default,
                                            can be provided in the command line (--password=XXXX) or disabled in the
                                            command line (--noPassword).

  --report                                  It generates reStructuredText (.rst) reports describing the configuration of
                                            each node.

  --upgrade                                 It regenerates the configuration reusing the previous keys. Use this flag
                                            when upgrading the version of bootstrap to keep your node up to date without
                                            dropping the local data. Backup the target folder before upgrading.

EXAMPLES
  $ symbol-bootstrap config -p bootstrap
  $ symbol-bootstrap config -p testnet -a dual --password 1234
  $ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap config -p testnet -a dual
```

_See code: [src/commands/config.ts](https://github.com/nemtech/symbol-bootstrap/blob/v1.0.8/src/commands/config.ts)_
