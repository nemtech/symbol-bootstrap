`symbol-bootstrap stop`
=======================

It stops the docker-compose network if running (symbol-bootstrap started with --detached). This is just a wrapper for the `docker-compose down` bash call.

* [`symbol-bootstrap stop`](#symbol-bootstrap-stop)

## `symbol-bootstrap stop`

It stops the docker-compose network if running (symbol-bootstrap started with --detached). This is just a wrapper for the `docker-compose down` bash call.

```
USAGE
  $ symbol-bootstrap stop

OPTIONS
  -h, --help           It shows the help of this command.
  -t, --target=target  [default: target] The target folder where the symbol-bootstrap network is generated

EXAMPLE
  $ symbol-bootstrap stop
```

_See code: [src/commands/stop.ts](https://github.com/nemtech/symbol-bootstrap/blob/v1.0.8/src/commands/stop.ts)_
