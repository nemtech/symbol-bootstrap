#!/bin/bash
set -e

symbol-bootstrap start --reset -p dualCurrency -a multinode --customPreset ./test/freenodes_preset.yml --user current -t target/bootstrap-freenodes
