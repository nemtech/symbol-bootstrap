#!/bin/bash
set -e
symbol-bootstrap enrollRewardProgram -t target/testnet-supernode  --useKnownRestGateways --password 1111 $1 $2 $3
