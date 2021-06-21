#!/bin/bash
set -e
symbol-bootstrap start -p testnet -a peer -t target/testnet-peer $1 $2 $3
