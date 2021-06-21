#!/bin/bash
set -e

# docker rm -f $(docker ps -aq)
symbol-bootstrap start -p singleCurrency -u current -t target/singleCurrency  -c test/custom_bootstrap.yml --password 1234 $1
