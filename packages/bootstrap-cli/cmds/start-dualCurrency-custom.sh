#!/bin/bash
set -e
symbol-bootstrap start -u current -p dualCurrency  -a multinode -c test/custom_preset.yml -t target/bootstrap-custom --password 1234 $1
