`symbol-bootstrap pack`
=======================

It configures and packages your node into a zip file that can be uploaded to the final node machine.

* [`symbol-bootstrap pack`](#symbol-bootstrap-pack)

## `symbol-bootstrap pack`

It configures and packages your node into a zip file that can be uploaded to the final node machine.

```
USAGE
  $ symbol-bootstrap pack

OPTIONS
  -a, --assembly=assembly                   (required) The assembly, example "dual" for testnet.

  -c, --customPreset=customPreset           (required) External preset file. Values in this file will override the
                                            provided presets

  -h, --help                                It shows the help of this command.

  -p, --preset=(bootstrap|testnet|mainnet)  (required) The network preset, can be provided via custom preset or cli
                                            parameter.

  -r, --reset                               It resets the configuration generating a new one

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

  --ready                                   If --ready is provided, the command will not ask offline confirmation.

  --report                                  It generates reStructuredText (.rst) reports describing the configuration of
                                            each node.

  --upgrade                                 It regenerates the configuration reusing the previous keys. Use this flag
                                            when upgrading the version of bootstrap to keep your node up to date without
                                            dropping the local data. The original preset (-t), assembly (-a), and custom
                                            preset (-a) must be used. Backup the target folder before upgrading.

EXAMPLES
  $ symbol-bootstrap pack
  $ symbol-bootstrap pack -p bootstrap -c custom-preset.yml
  $ symbol-bootstrap pack -p testnet -a dual -c custom-preset.yml
  $ symbol-bootstrap pack -p mainnet -a dual --password 1234 -c custom-preset.yml
  $ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap pack -p mainnet -a dual -c custom-preset.yml
```

_See code: [src/commands/pack.ts](https://github.com/nemtech/symbol-bootstrap/blob/v1.0.8/src/commands/pack.ts)_
