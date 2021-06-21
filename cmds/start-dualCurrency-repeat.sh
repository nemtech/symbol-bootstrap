#!/bin/bash
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
symbol-bootstrap start -p dualCurrency -a multinode -c test/repeat_preset.yml -t target/bootstrap-repeat --password 1234 $1
