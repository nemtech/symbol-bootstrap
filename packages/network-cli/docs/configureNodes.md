`symbol-network configureNodes`
===============================

This is the last step of the node cluster setup that generates and updates each node's configuration.

Each node defined in the "network.yml" file will have it's own symbol-bootstrap "target" folder. Each folder can be then be deployed into the final node boxes like in AWS.

This command can be executed multiple times if you need to update or upgrade your nodes. Then you can redeploy the configuration in the final the node boxes.

* [`symbol-network configureNodes`](#symbol-network-configurenodes)

## `symbol-network configureNodes`

This is the last step of the node cluster setup that generates and updates each node's configuration.

```
USAGE
  $ symbol-network configureNodes

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  Each node defined in the "network.yml" file will have it's own symbol-bootstrap "target" folder. Each folder can be 
  then be deployed into the final node boxes like in AWS.

  This command can be executed multiple times if you need to update or upgrade your nodes. Then you can redeploy the 
  configuration in the final the node boxes.

EXAMPLE
  $ symbol-network configureNodes
```
