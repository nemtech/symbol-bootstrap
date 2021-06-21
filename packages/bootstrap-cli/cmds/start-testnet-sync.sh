#!/bin/bash
set -e
symbol-bootstrap config -p testnet -a api -t target/testnet-sync -r
echo "Copying Data"
cp -rf ../networks/testnet-sync/data ./target/testnet-sync/nodes/api-node
echo "Copying DB"
mkdir -p ./target/testnet-sync/databases/db
cp -rf ../networks/testnet-sync/db ./target/testnet-sync/databases
symbol-bootstrap compose -t target/testnet-sync
symbol-bootstrap run -t target/testnet-sync
