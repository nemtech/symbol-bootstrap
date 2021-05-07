`symbol-bootstrap link`
=======================

It announces VRF and Voting Link transactions to the network for each node with 'Peer' or 'Voting' roles. This command finalizes the node registration to an existing network.

* [`symbol-bootstrap link`](#symbol-bootstrap-link)

## `symbol-bootstrap link`

It announces VRF and Voting Link transactions to the network for each node with 'Peer' or 'Voting' roles. This command finalizes the node registration to an existing network.

```
USAGE
  $ symbol-bootstrap link

OPTIONS
  -h, --help              It shows the help of this command.
  -t, --target=target     [default: target] The target folder where the symbol-bootstrap network is generated
  -u, --url=url           [default: http://localhost:3000] the network url

  --maxFee=maxFee         The max fee used when announcing (absolute). The network 'announceDefaultMaxFee' will be used
                          (0.1 XYMs/Coins).

  --noPassword            When provided, Bootstrap will not use a password, so private keys will be stored in plain
                          text. Use with caution.

  --password=password     A password used to encrypt and decrypt private keys in preset files like addresses.yml and
                          preset.yml. Bootstrap prompts for a password by default, can be provided in the command line
                          (--password=XXXX) or disabled in the command line (--noPassword).

  --ready                 If --ready is provided, the command will not ask for confirmation when announcing
                          transactions.

  --unlink                Perform "Unlink" transactions unlinking the voting and VRF keys from the node signer account

  --useKnownRestGateways  Use the best NEM node available when announcing. Otherwise the command will use the node
                          provided by the --url parameter.

EXAMPLES
  $ symbol-bootstrap link
  $ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap link --unlink --useKnownRestGateways
```

_See code: [src/commands/link.ts](https://github.com/nemtech/symbol-bootstrap/blob/v1.0.6/src/commands/link.ts)_
