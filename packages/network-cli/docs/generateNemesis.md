`symbol-network generateNemesis`
================================

This "one-time" command is the third step when creating a new network after running the "expandNodes" command.

This step is only required when you are creating a new network, if you are creating a node cluster of an existing network you can skip this step and go directly to the "configureNodes" command.

After running this command, your new network nemesis seed would be created. It also generates a dummy node that you can run to try before deploying it into production.

* [`symbol-network generateNemesis`](#symbol-network-generatenemesis)

## `symbol-network generateNemesis`

This "one-time" command is the third step when creating a new network after running the "expandNodes" command.

```
USAGE
  $ symbol-network generateNemesis

OPTIONS
  -h, --help    show CLI help
  --regenerate  To regenerate the nemesis block. This will drop the existing nemesis block and node configuration

DESCRIPTION
  This step is only required when you are creating a new network, if you are creating a node cluster of an existing 
  network you can skip this step and go directly to the "configureNodes" command.

  After running this command, your new network nemesis seed would be created. It also generates a dummy node that you 
  can run to try before deploying it into production.

EXAMPLE
  $ symbol-network generateNemesis
```
