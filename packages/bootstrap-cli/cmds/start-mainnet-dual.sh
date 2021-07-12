#!/bin/bash
set -e
symbol-bootstrap start -p mainnet -a dual -t target/mainnet-dual  -c test/mainnet_preset.yml $1 $2 $3
