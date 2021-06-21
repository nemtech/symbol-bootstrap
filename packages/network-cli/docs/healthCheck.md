`symbol-network healthCheck`
============================

It health checks the nodes of the network once the network is running by performing several remote tests.

* [`symbol-network healthCheck`](#symbol-network-healthcheck)

## `symbol-network healthCheck`

It health checks the nodes of the network once the network is running by performing several remote tests.

```
USAGE
  $ symbol-network healthCheck

OPTIONS
  -h, --help                                                                                     show CLI help

  --maxBlockDiff=maxBlockDiff                                                                    [default: 10] max block
                                                                                                 diff

  --maxFinalizedBlockDiff=maxFinalizedBlockDiff                                                  [default: 5] max
                                                                                                 finalized block diff

  --region=(us-east-1|us-west-1|us-west-2|eu-west-1|eu-central-1|ap-northeast-1|ap-southeast-1)  filter the report by
                                                                                                 region

  --timeout=timeout                                                                              [default: 10000] test
                                                                                                 timeout

EXAMPLE
  $ symbol-network healthCheck
```
