#!/bin/bash
set -e

symbol-bootstrap config -p dualCurrency -a multinode --report -t target/bootstrap $1
