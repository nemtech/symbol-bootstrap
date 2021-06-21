#!/bin/bash
set -e
symbol-bootstrap config -p mainnet -a dual -t target/mainnet-dual  -c test/mainnet_preset_non_voting.yml --noPassword $1 $2 $3
symbol-bootstrap config -p mainnet -a api -t target/mainnet-api  -c test/mainnet_preset_non_voting.yml --noPassword $1 $2 $3
symbol-bootstrap config -p mainnet -a peer -t target/mainnet-peer  -c test/mainnet_preset_non_voting.yml --noPassword $1 $2 $3
symbol-bootstrap config -p mainnet -a dual -t target/mainnet-dual-voting  -c test/mainnet_preset_voting.yml --noPassword $1 $2 $3
symbol-bootstrap config -p mainnet -a api -t target/mainnet-api-voting  -c test/mainnet_preset_voting.yml --noPassword $1 $2 $3
symbol-bootstrap config -p mainnet -a peer -t target/mainnet-peer-voting  -c test/mainnet_preset_voting.yml --noPassword $1 $2 $3
