#!/bin/bash
set -e
symbol-bootstrap start -p testnet -a demo -t target/testnet-demo --noPassword $1 $2 $3
