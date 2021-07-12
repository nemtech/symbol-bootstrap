#!/bin/bash
set -e
symbol-bootstrap start -p testnet -a demo -t target/testnet-supernode -c test/supernode.yml  $1 $2 $3
