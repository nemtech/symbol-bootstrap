`symbol-network init`
=====================

This command is the first step configuring the node cluster for an existing an network or a new network.

It's prompt style wizard that asks a series of questions to start defining your nodes. The ouput of this command is a file containing a list of node types you want to create.

This is a "one time" command that will kick the network setup process. Please follow the instructions on the screen.

This commands creates the initial 'network-input.yml' and 'custom-network-preset.yml' files.

* [`symbol-network init`](#symbol-network-init)

## `symbol-network init`

This command is the first step configuring the node cluster for an existing an network or a new network.

```
USAGE
  $ symbol-network init

OPTIONS
  -h, --help       show CLI help
  --output=output  [default: network-input.yml] Where to store the initial input network file.
  --ready          if --read is provided, the won't ask for confirmations

DESCRIPTION
  It's prompt style wizard that asks a series of questions to start defining your nodes. The ouput of this command is a 
  file containing a list of node types you want to create.

  This is a "one time" command that will kick the network setup process. Please follow the instructions on the screen.

  This commands creates the initial 'network-input.yml' and 'custom-network-preset.yml' files.

EXAMPLE
  $ symbol-network init
```
