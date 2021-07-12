#!/bin/bash
set -e

# docker rm -f $(docker ps -aq)
symbol-bootstrap stop -t target/bootstrap
