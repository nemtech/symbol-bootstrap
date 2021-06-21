#!/bin/bash
set -e

symbol-bootstrap start -p dualCurrency -a demo -t target/bootstrap --password 1234 -c test/full_preset.yml $1 $2 $3
