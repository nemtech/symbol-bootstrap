#!/bin/bash
set -e
echo "Starting explorer $1"
cp default.json /app/src/config/default.json
cd /app
npm start
